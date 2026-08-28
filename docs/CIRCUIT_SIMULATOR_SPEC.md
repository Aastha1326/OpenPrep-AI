# OpenPrep AI Digital Logic Gate & Circuit Simulator Specification

## System Architecture

```
+-------------------------------------------------------------+
|              Digital Logic Circuit Breadboard Canvas        |
+-------------------------------------------------------------+
   |                                                        |
   v                                                        v
+-----------------------------+              +-----------------------------+
| Interactive Gate Placer     |              | Wire Routing & Propagation  |
| (AND, OR, NOT, XOR, NAND)   |              | (Live Voltage High/Low Glow)|
+--------------+--------------+              +--------------+--------------+
               |                                            |
               +----------------------+---------------------+
                                      |
                                      v
+-------------------------------------------------------------+
|             Boolean Algebraic & Truth Table Engine          |
| - Exhaustive 2^N Matrix Generation                          |
| - Propagation Delay Estimation                              |
| - Timing Waveform Oscilloscope Timeline                     |
+-------------------------------------------------------------+
```

## Supported Logic Modules
- **Basic Gates**: AND, OR, NOT, BUFFER.
- **Universal Gates**: NAND, NOR.
- **Parity / Arithmetic**: XOR, XNOR, Half Adder, Full Adder.
- **Sequential Memory**: SR Latch, D Flip-Flop.
