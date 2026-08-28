class CircuitService {
  constructor() {
    this.prebuiltTemplates = [
      {
        id: 'half-adder',
        title: 'Half Adder Circuit',
        category: 'ARITHMETIC',
        description: 'Computes sum and carry-out for two single-bit binary inputs A and B.',
        inputs: ['A', 'B'],
        outputs: ['Sum', 'Carry'],
        nodes: [
          { id: 'in_a', type: 'INPUT', label: 'A', x: 50, y: 100 },
          { id: 'in_b', type: 'INPUT', label: 'B', x: 50, y: 200 },
          { id: 'gate_xor', type: 'XOR', label: 'XOR', x: 250, y: 120 },
          { id: 'gate_and', type: 'AND', label: 'AND', x: 250, y: 220 },
          { id: 'out_sum', type: 'OUTPUT', label: 'Sum', x: 450, y: 120 },
          { id: 'out_carry', type: 'OUTPUT', label: 'Carry', x: 450, y: 220 },
        ],
        wires: [
          { from: 'in_a', to: 'gate_xor', pin: 0 },
          { from: 'in_b', to: 'gate_xor', pin: 1 },
          { from: 'in_a', to: 'gate_and', pin: 0 },
          { from: 'in_b', to: 'gate_and', pin: 1 },
          { from: 'gate_xor', to: 'out_sum', pin: 0 },
          { from: 'gate_and', to: 'out_carry', pin: 0 },
        ],
      },
      {
        id: 'sr-latch',
        title: 'SR Latch (NAND-based)',
        category: 'SEQUENTIAL',
        description: 'Basic bistable multivibrator memory element with Set and Reset pins.',
        inputs: ['Set', 'Reset'],
        outputs: ['Q', 'Q_not'],
        nodes: [
          { id: 'in_s', type: 'INPUT', label: 'Set', x: 50, y: 100 },
          { id: 'in_r', type: 'INPUT', label: 'Reset', x: 50, y: 250 },
          { id: 'nand_1', type: 'NAND', label: 'NAND 1', x: 250, y: 110 },
          { id: 'nand_2', type: 'NAND', label: 'NAND 2', x: 250, y: 240 },
          { id: 'out_q', type: 'OUTPUT', label: 'Q', x: 450, y: 110 },
          { id: 'out_qnot', type: 'OUTPUT', label: 'Q_not', x: 450, y: 240 },
        ],
        wires: [
          { from: 'in_s', to: 'nand_1', pin: 0 },
          { from: 'in_r', to: 'nand_2', pin: 1 },
          { from: 'nand_1', to: 'out_q', pin: 0 },
          { from: 'nand_2', to: 'out_qnot', pin: 0 },
        ],
      },
    ];
  }

  /**
   * Evaluates logic gate output given input states (0 or 1)
   */
  evaluateGate(type, inputs = []) {
    const a = inputs[0] ? 1 : 0;
    const b = inputs[1] ? 1 : 0;

    switch (type.toUpperCase()) {
      case 'AND':
        return a && b ? 1 : 0;
      case 'OR':
        return a || b ? 1 : 0;
      case 'NOT':
        return a ? 0 : 1;
      case 'NAND':
        return !(a && b) ? 1 : 0;
      case 'NOR':
        return !(a || b) ? 1 : 0;
      case 'XOR':
        return (a ^ b) ? 1 : 0;
      case 'XNOR':
        return !(a ^ b) ? 1 : 0;
      case 'BUFFER':
      case 'INPUT':
        return a;
      default:
        return 0;
    }
  }

  /**
   * Simulates full circuit propagation given current input pin values
   */
  evaluateCircuit(nodes = [], wires = [], inputValues = {}) {
    const nodeState = new Map();

    // Set initial input nodes
    nodes.forEach((n) => {
      if (n.type === 'INPUT') {
        const val = inputValues[n.label] !== undefined ? inputValues[n.label] : (inputValues[n.id] || 0);
        nodeState.set(n.id, val ? 1 : 0);
      }
    });

    // Topological propagation (multi-pass for settling)
    for (let pass = 0; pass < 5; pass++) {
      nodes.forEach((node) => {
        if (node.type === 'INPUT') return;

        // Gather all incoming wires
        const incomingWires = wires.filter((w) => w.to === node.id);
        const inputVals = incomingWires.map((w) => nodeState.get(w.from) || 0);

        if (node.type === 'OUTPUT') {
          nodeState.set(node.id, inputVals[0] || 0);
        } else {
          nodeState.set(node.id, this.evaluateGate(node.type, inputVals));
        }
      });
    }

    const outputValues = {};
    nodes.filter((n) => n.type === 'OUTPUT').forEach((n) => {
      outputValues[n.label || n.id] = nodeState.get(n.id) || 0;
    });

    return {
      nodeStates: Object.fromEntries(nodeState),
      outputs: outputValues,
    };
  }

  /**
   * Generates exhaustive 2^N truth table matrix
   */
  generateTruthTable(nodes = [], wires = [], inputLabels = []) {
    const inputNodes = nodes.filter((n) => n.type === 'INPUT');
    const outputNodes = nodes.filter((n) => n.type === 'OUTPUT');
    const inputNames = inputLabels.length > 0 ? inputLabels : inputNodes.map((n) => n.label || n.id);

    const numRows = Math.pow(2, inputNames.length);
    const rows = [];

    for (let i = 0; i < numRows; i++) {
      const inputVector = {};
      inputNames.forEach((name, bitIndex) => {
        // MSB to LSB
        const shift = inputNames.length - 1 - bitIndex;
        inputVector[name] = (i >> shift) & 1;
      });

      const { outputs } = this.evaluateCircuit(nodes, wires, inputVector);

      rows.push({
        inputs: inputVector,
        outputs,
      });
    }

    return {
      inputHeaders: inputNames,
      outputHeaders: outputNodes.map((n) => n.label || n.id),
      rows,
    };
  }

  getTemplates() {
    return this.prebuiltTemplates;
  }
}

module.exports = new CircuitService();
