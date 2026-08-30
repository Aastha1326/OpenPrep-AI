import { describe, it, expect } from 'vitest';
import circuitService from '../../services/circuitService';

describe('CircuitService Boolean Logic & Truth Table Unit Tests', () => {
  it('should evaluate individual logic gates properly', () => {
    expect(circuitService.evaluateGate('AND', [1, 1])).toBe(1);
    expect(circuitService.evaluateGate('AND', [1, 0])).toBe(0);
    expect(circuitService.evaluateGate('OR', [0, 1])).toBe(1);
    expect(circuitService.evaluateGate('NOT', [1])).toBe(0);
    expect(circuitService.evaluateGate('XOR', [1, 0])).toBe(1);
    expect(circuitService.evaluateGate('XOR', [1, 1])).toBe(0);
    expect(circuitService.evaluateGate('NAND', [1, 1])).toBe(0);
    expect(circuitService.evaluateGate('NOR', [0, 0])).toBe(1);
  });

  it('should correctly simulate a Half Adder circuit', () => {
    const template = circuitService.getTemplates().find((t) => t.id === 'half-adder');
    expect(template).toBeDefined();

    // Test A=1, B=0 => Sum=1, Carry=0
    const res1 = circuitService.evaluateCircuit(template.nodes, template.wires, { A: 1, B: 0 });
    expect(res1.outputs.Sum).toBe(1);
    expect(res1.outputs.Carry).toBe(0);

    // Test A=1, B=1 => Sum=0, Carry=1
    const res2 = circuitService.evaluateCircuit(template.nodes, template.wires, { A: 1, B: 1 });
    expect(res2.outputs.Sum).toBe(0);
    expect(res2.outputs.Carry).toBe(1);
  });

  it('should generate complete 4-row truth table for 2-input Half Adder', () => {
    const template = circuitService.getTemplates().find((t) => t.id === 'half-adder');
    const table = circuitService.generateTruthTable(template.nodes, template.wires, ['A', 'B']);

    expect(table.rows.length).toBe(4);
    expect(table.inputHeaders).toEqual(['A', 'B']);
    expect(table.outputHeaders).toContain('Sum');
    expect(table.outputHeaders).toContain('Carry');
  });
});
