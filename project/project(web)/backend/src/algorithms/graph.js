/**
 * DirectedGraph Implementation
 * Vertices represent Tasks, directed edges represent Dependencies (u -> v means v depends on u).
 */
export class DirectedGraph {
  constructor() {
    // Map of vertexId -> Task data object
    this.vertices = new Map();
    // Map of vertexId -> Array of successor vertexIds (u -> v)
    this.adjList = new Map();
    // Map of vertexId -> Array of predecessor vertexIds (v has predecessor u)
    this.predList = new Map();
    // Map of vertexId -> inDegree count
    this.inDegree = new Map();
    // Map of vertexId -> outDegree count
    this.outDegree = new Map();
  }

  /**
   * Add a task as a vertex in the graph
   * @param {string} id - Unique task identifier
   * @param {Object} data - Task data (name, duration, etc.)
   */
  addVertex(id, data = {}) {
    if (!this.vertices.has(id)) {
      this.vertices.set(id, { id, ...data });
      this.adjList.set(id, []);
      this.predList.set(id, []);
      this.inDegree.set(id, 0);
      this.outDegree.set(id, 0);
    } else if (data && Object.keys(data).length > 0) {
      this.vertices.set(id, { ...this.vertices.get(id), ...data });
    }
  }

  /**
   * Add a directed dependency edge: fromId -> toId
   * Meaning: 'fromId' must complete before 'toId' can start.
   * @param {string} fromId - Predecessor task ID
   * @param {string} toId - Successor task ID
   * @returns {boolean} Whether the edge was successfully added
   */
  addEdge(fromId, toId) {
    if (fromId === toId) {
      throw new Error('A task cannot depend on itself.');
    }

    if (!this.vertices.has(fromId) || !this.vertices.has(toId)) {
      throw new Error(`Cannot add edge between non-existent vertices: ${fromId} -> ${toId}`);
    }

    const successors = this.adjList.get(fromId);
    if (successors.includes(toId)) {
      return false; // Edge already exists (avoid duplicates)
    }

    successors.push(toId);
    this.predList.get(toId).push(fromId);

    this.outDegree.set(fromId, (this.outDegree.get(fromId) || 0) + 1);
    this.inDegree.set(toId, (this.inDegree.get(toId) || 0) + 1);

    return true;
  }

  /**
   * Remove a directed dependency edge
   */
  removeEdge(fromId, toId) {
    if (!this.adjList.has(fromId) || !this.predList.has(toId)) return false;

    const successors = this.adjList.get(fromId);
    const sIndex = successors.indexOf(toId);
    if (sIndex !== -1) {
      successors.splice(sIndex, 1);
      this.outDegree.set(fromId, Math.max(0, (this.outDegree.get(fromId) || 1) - 1));
    }

    const predecessors = this.predList.get(toId);
    const pIndex = predecessors.indexOf(fromId);
    if (pIndex !== -1) {
      predecessors.splice(pIndex, 1);
      this.inDegree.set(toId, Math.max(0, (this.inDegree.get(toId) || 1) - 1));
    }

    return true;
  }

  hasVertex(id) {
    return this.vertices.has(id);
  }

  hasEdge(fromId, toId) {
    return this.adjList.has(fromId) && this.adjList.get(fromId).includes(toId);
  }

  getVertex(id) {
    return this.vertices.get(id);
  }

  getAllVertices() {
    return Array.from(this.vertices.values());
  }

  getAllVertexIds() {
    return Array.from(this.vertices.keys());
  }

  getSuccessors(id) {
    return this.adjList.get(id) ? [...this.adjList.get(id)] : [];
  }

  getPredecessors(id) {
    return this.predList.get(id) ? [...this.predList.get(id)] : [];
  }

  getInDegree(id) {
    return this.inDegree.get(id) || 0;
  }

  getOutDegree(id) {
    return this.outDegree.get(id) || 0;
  }

  getVertexCount() {
    return this.vertices.size;
  }

  getEdgeCount() {
    let count = 0;
    for (const successors of this.adjList.values()) {
      count += successors.length;
    }
    return count;
  }

  /**
   * Return readable adjacency list representation
   */
  toAdjacencyListObject() {
    const obj = {};
    for (const [id, successors] of this.adjList.entries()) {
      const task = this.vertices.get(id);
      obj[task?.name || id] = successors.map(sId => this.vertices.get(sId)?.name || sId);
    }
    return obj;
  }
}
