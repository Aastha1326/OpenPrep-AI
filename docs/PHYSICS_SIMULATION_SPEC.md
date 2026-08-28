# OpenPrep AI Classical Mechanics & 2D Physics Sandbox Specification

## Architecture

```
+-------------------------------------------------------------+
|               Interactive 2D HTML5 Physics Canvas           |
+-------------------------------------------------------------+
   |                                                        |
   v                                                        v
+-----------------------------+              +-----------------------------+
| Numerical Verlet Integrator |              | Momentum & Energy Phase     |
| (Collisions, Drag, Springs) |              | Diagram Plotter             |
+--------------+--------------+              +--------------+--------------+
               |                                            |
               +----------------------+---------------------+
                                      |
                                      v
+-------------------------------------------------------------+
| Precision Parametric Control Dials (Mass, Gravity, Friction)|
+-------------------------------------------------------------+
```

## Physics Equations
1. **Conservation of Linear Momentum**:

$$m_1 u_1 + m_2 u_2 = m_1 v_1 + m_2 v_2$$

2. **Coefficient of Restitution**:

$$e = \frac{v_2 - v_1}{u_1 - u_2}$$

3. **Projectile Parabolic Motion**:

$$y(t) = h + (v_0 \sin\theta)t - \frac{1}{2}gt^2$$
