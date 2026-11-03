

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { ingestDocumentBatch } from '../services/rag/ragIngestionService.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studygauge';

const DEMO_DOCUMENTS = [

  {
    title: "Newton's Laws of Motion – JEE Physics",
    contentType: 'markdown',
    metadata: {
      exam: 'JEE',
      subject: 'Physics',
      topic: "Newton's Laws of Motion",
      source: 'StudyGauge Core Content',
      difficulty: 'intermediate',
      tags: ['mechanics', 'newton', 'forces', 'dynamics'],
      year: 2024,
    },
    rawContent: `# Newton's Laws of Motion

Newton's Laws of Motion are fundamental principles in classical mechanics that describe the relationship between a body and the forces acting upon it, and the body's motion in response.

## First Law (Law of Inertia)

An object at rest remains at rest, and an object in motion remains in motion with constant velocity, unless acted upon by an external net force.

**Key Concept: Inertia** — The resistance of any physical object to any change in its velocity, including changes to the object's speed or direction of motion.

**JEE Insight:** Questions often test whether students recognize that zero net force does NOT mean zero velocity — it means zero acceleration.

Example: A ball rolling on a frictionless surface continues rolling indefinitely (no net horizontal force).

## Second Law (Law of Force and Acceleration)

The net force acting on an object is equal to the rate of change of its momentum:

**F_net = ma** (when mass is constant)

More generally: **F_net = dp/dt** where p = mv is momentum.

**Key Relationships:**
- Force is measured in Newtons (N = kg·m/s²)
- Acceleration is directly proportional to net force
- Acceleration is inversely proportional to mass

**JEE Tip:** Always identify ALL forces acting on an object (gravity, normal force, friction, tension, applied force) before applying F = ma. Drawing Free Body Diagrams (FBDs) is critical.

**Example Problem:**
A 5 kg block is pushed with a horizontal force of 30 N. If friction force is 10 N, find acceleration.
- Net Force = 30 - 10 = 20 N
- Acceleration = F/m = 20/5 = 4 m/s²

## Third Law (Law of Action-Reaction)

For every action, there is an equal and opposite reaction.

**F_AB = -F_BA**

**Critical Point:** Action-reaction pairs act on DIFFERENT objects, not the same object. This is a common source of errors.

**Example:** When you push a wall with 100 N, the wall pushes back on you with 100 N. The two forces are equal in magnitude but opposite in direction.

## Common JEE Problem Types

1. **Atwood Machine:** Two masses over a pulley — use Newton's 2nd law for each mass separately.
2. **Inclined Plane:** Resolve forces along and perpendicular to incline.
3. **Connected Bodies:** String/pulley systems require considering the system's total mass.
4. **Spring-Mass Problems:** F = -kx (Hooke's Law combined with Newton's 2nd Law).

## Important Formulas

- Net Force: F = ma
- Momentum: p = mv
- Impulse: J = F·t = Δp
- Weight: W = mg (g = 9.8 m/s² ≈ 10 m/s² in JEE)

## Common Mistakes to Avoid

- Forgetting to include friction or normal forces in FBDs
- Confusing action-reaction pairs as cancelling each other
- Applying F = ma to non-inertial frames without pseudo forces
- Ignoring the vector nature of force and acceleration`,
  },

  {
    title: 'Periodic Table Trends – JEE Chemistry',
    contentType: 'markdown',
    metadata: {
      exam: 'JEE',
      subject: 'Chemistry',
      topic: 'Periodic Table and Periodicity',
      source: 'StudyGauge Core Content',
      difficulty: 'intermediate',
      tags: ['periodic table', 'ionization energy', 'electronegativity', 'atomic radius'],
      year: 2024,
    },
    rawContent: `# Periodic Table Trends

Understanding periodic trends is essential for predicting chemical behavior and solving JEE Chemistry problems efficiently.

## Atomic Radius

Atomic radius is the measure of the size of an atom.

**Trend Across Period (left to right):** Decreases
- Increasing nuclear charge pulls electrons closer with same number of shells
- Effective nuclear charge (Z_eff) increases

**Trend Down a Group (top to bottom):** Increases
- New electron shells are added, shielding the outer electrons from nuclear charge

**Key Values to Remember:**
- Smallest: Helium (He) — but Fluorine (F) is smallest among reactive elements
- Largest: Cesium (Cs) among main group elements

**JEE Trap:** Noble gases have larger atomic radii than adjacent halogens due to van der Waals radii vs. covalent radii comparison.

## Ionization Energy (IE)

Ionization energy is the energy required to remove the outermost electron from a gaseous atom.

**Trend Across Period:** Increases (with notable exceptions)
**Trend Down Group:** Decreases

**Important Exceptions:**
1. Be > B: Be has a filled 2s² subshell (extra stability)
2. N > O: N has half-filled 2p³ configuration (extra stability due to exchange energy)
3. Mg > Al: Mg has filled 3s² subshell

**Second Ionization Energy:** Always greater than first IE.
**Discontinuous jumps** in successive IEs indicate which group an element belongs to.

## Electronegativity (EN)

Electronegativity measures the tendency of an atom to attract bonding electrons.

**Scale:** Pauling scale (Fluorine = 4.0, highest)

**Trend Across Period:** Increases
**Trend Down Group:** Decreases

**Most Electronegative:** F > O > N > Cl > Br > S

**Applications:**
- Predicting bond polarity: larger ΔEN → more polar bond
- Determining oxidation states
- Predicting acid-base strength

## Electron Affinity (EA)

Energy change when an electron is added to a neutral gaseous atom.

**Trend Across Period:** Generally increases (more negative = more favorable)
**Trend Down Group:** Decreases

**Exceptions:**
- N has lower EA than expected (half-filled 2p³ stability)
- O has lower EA than S (electron repulsion in small O atom)
- Be, Mg, noble gases have positive (unfavorable) EA

## Summary Table

| Property | Across Period | Down Group |
|----------|--------------|------------|
| Atomic Radius | Decreases | Increases |
| Ionization Energy | Increases | Decreases |
| Electronegativity | Increases | Decreases |
| Electron Affinity | Increases | Decreases |
| Metallic Character | Decreases | Increases |

## JEE Previous Year Trend Questions

Common question types:
1. Arrange elements in order of increasing/decreasing property
2. Identify anomalous behavior exceptions
3. Relate periodic trend to bond strength or acid-base behavior
4. Compare isoelectronic species (same electrons, different Z)

For isoelectronic species: Increasing Z → decreasing size (more nuclear pull on same electrons).
Example: N³⁻ > O²⁻ > F⁻ > Na⁺ > Mg²⁺ (all have 10 electrons)`,
  },

  {
    title: 'Cell Division: Mitosis and Meiosis – NEET Biology',
    contentType: 'markdown',
    metadata: {
      exam: 'NEET',
      subject: 'Biology',
      topic: 'Cell Division',
      source: 'StudyGauge Core Content',
      difficulty: 'intermediate',
      tags: ['mitosis', 'meiosis', 'cell cycle', 'chromosomes', 'NEET'],
      year: 2024,
    },
    rawContent: `# Cell Division: Mitosis and Meiosis

Cell division is a fundamental biological process. NEET questions heavily test the stages, significance, and comparisons between mitosis and meiosis.

## Cell Cycle

The cell cycle has two major phases:

**Interphase (90% of cell cycle time):**
- G1 phase (Gap 1): Cell growth, protein synthesis
- S phase (Synthesis): DNA replication (amount doubles from 2N to 4N DNA content)
- G2 phase (Gap 2): Preparation for division, organelle duplication

**Mitotic Phase (M Phase):** Actual cell division

**G0 Phase:** Quiescent phase — cells exit cell cycle (e.g., neurons, RBCs)

## Mitosis

Mitosis produces two genetically identical daughter cells. Found in somatic (body) cells.

### Stages of Mitosis:

**1. Prophase:**
- Chromatin condenses into visible chromosomes
- Each chromosome has 2 chromatids joined at centromere
- Mitotic spindle begins forming
- Nucleolus disappears
- Nuclear envelope begins to break down

**2. Metaphase:**
- Chromosomes align at metaphase plate (equatorial plane)
- Spindle fibers attach to kinetochores
- Easiest stage to count chromosomes (most condensed)

**3. Anaphase:**
- Centromeres split
- Sister chromatids pulled to opposite poles
- Cell elongates

**4. Telophase:**
- Nuclear envelopes re-form around each set of chromosomes
- Chromosomes decondense
- Nucleoli reappear
- Spindle disappears

**5. Cytokinesis:**
- Animal cells: cleavage furrow (actin-myosin contraction)
- Plant cells: cell plate forms (from Golgi vesicles)

**Result:** 2 diploid (2N) cells with same genetic content as parent

## Meiosis

Meiosis produces four genetically unique haploid gametes. Occurs in reproductive organs.

### Meiosis I (Reductional Division):

**Prophase I (longest, most complex):**
- Leptonema: Chromosomes begin condensing
- Zygonema: Homologous chromosomes pair (synapsis)
- Pachynema: Crossing over occurs at chiasmata (genetic recombination!)
- Diplonema: Bivalents separate, chiasmata visible
- Diakinesis: Chromosomes fully condensed, nuclear envelope breaks down

**Metaphase I:** Bivalents (homologous pairs) align at equator

**Anaphase I:** Homologous chromosomes (NOT sister chromatids) separate

**Telophase I:** Two cells with haploid number of chromosomes (but each chromosome still has 2 chromatids)

### Meiosis II (Equational Division — similar to mitosis):

Prophase II → Metaphase II → Anaphase II (sister chromatids separate) → Telophase II

**Result:** 4 haploid (N) cells, each genetically unique

## Key Comparisons: Mitosis vs Meiosis

| Feature | Mitosis | Meiosis |
|---------|---------|---------|
| Divisions | 1 | 2 |
| Daughter Cells | 2 | 4 |
| Ploidy | Diploid (2N) | Haploid (N) |
| Genetic Identity | Identical | Variable |
| Crossing Over | No | Yes (Prophase I) |
| Occurs In | Somatic cells | Germ cells |
| Purpose | Growth, repair | Sexual reproduction |

## NEET High-Yield Points

1. **Chiasmata** = physical site of crossing over; seen during Pachynema
2. **Synapsis** = pairing of homologous chromosomes; begins at Zygonema
3. **Bivalent/Tetrad** = paired homologous chromosomes (4 chromatids total)
4. **Synaptonemal complex** = protein structure that holds homologs together during synapsis
5. **Significance of Meiosis:** Maintains chromosome number across generations; generates genetic diversity

## Common NEET Mistakes

- Confusing chromatid separation in Anaphase I vs II
- Missing that DNA replication does NOT occur between Meiosis I and II
- Forgetting that in plants, meiosis occurs to form spores (not directly gametes)
- Confusing Anaphase (chromatids separate in mitosis/meiosis II) with Anaphase I (homologs separate)`,
  },

  {
    title: 'Indian Constitution – Fundamental Rights and DPSP',
    contentType: 'markdown',
    metadata: {
      exam: 'UPSC',
      subject: 'Polity',
      topic: 'Fundamental Rights and DPSP',
      source: 'StudyGauge Core Content',
      difficulty: 'intermediate',
      tags: ['constitution', 'fundamental rights', 'DPSP', 'UPSC', 'polity'],
      year: 2024,
    },
    rawContent: `# Indian Constitution: Fundamental Rights and Directive Principles

## Fundamental Rights (Part III, Articles 12–35)

Fundamental Rights are justiciable rights guaranteed to all citizens and in some cases to all persons in India. They can be enforced through the Supreme Court (Article 32) or High Courts (Article 226).

### The Six Fundamental Rights:

**1. Right to Equality (Articles 14–18)**
- Article 14: Equality before law and equal protection of laws
- Article 15: Prohibition of discrimination on grounds of religion, race, caste, sex, place of birth
- Article 16: Equality of opportunity in public employment
- Article 17: Abolition of untouchability (made a criminal offense)
- Article 18: Abolition of titles (except military/academic)

**2. Right to Freedom (Articles 19–22)**
- Article 19: Six freedoms — speech & expression, assembly, association, movement, residence, profession
- Article 20: Protection in respect of conviction for offenses
- Article 21: Protection of life and personal liberty (most litigated fundamental right)
- Article 21A: Right to Education (added by 86th Amendment, 2002)
- Article 22: Protection against arbitrary arrest and detention

**3. Right Against Exploitation (Articles 23–24)**
- Article 23: Prohibition of traffic in human beings and forced labor
- Article 24: Prohibition of employment of children below 14 in factories, mines, hazardous employment

**4. Right to Freedom of Religion (Articles 25–28)**
- Article 25: Freedom of conscience and free profession, practice, and propagation of religion
- Article 26: Freedom to manage religious affairs
- Article 27: Freedom from paying taxes for promotion of any religion
- Article 28: Freedom from attending religious instruction in state-funded institutions

**5. Cultural and Educational Rights (Articles 29–30)**
- Article 29: Protection of interests of minorities
- Article 30: Right of minorities to establish and administer educational institutions

**6. Right to Constitutional Remedies (Article 32)**
- Called "Heart and Soul of the Constitution" by Dr. B.R. Ambedkar
- Right to approach Supreme Court for enforcement of fundamental rights
- Writs: Habeas Corpus, Mandamus, Prohibition, Certiorari, Quo Warranto

### Suspension of Fundamental Rights:
- During National Emergency (Article 352): Article 19 suspended automatically; Article 20, 21 cannot be suspended
- Article 358 vs 359: 358 = automatic suspension of Art. 19; 359 = Presidential Order needed

## Directive Principles of State Policy (Part IV, Articles 36–51)

DPSPs are non-justiciable guidelines for the State in making laws. They represent the socio-economic democracy aimed at. Inspired by Irish Constitution.

### Classification of DPSPs:

**Socialistic Principles:**
- Article 38: Social order for promotion of welfare
- Article 39: Adequate means of livelihood; equal pay for equal work
- Article 41: Right to work, education, public assistance
- Article 42: Just and humane conditions of work; maternity relief
- Article 43: Living wage for workers
- Article 47: Duty of State to raise level of nutrition and standard of living

**Gandhian Principles:**
- Article 40: Organization of village panchayats
- Article 43: Cottage industries in rural areas
- Article 46: Educational and economic interests of SC, ST and weaker sections
- Article 48: Organization of agriculture and animal husbandry

**Liberal-Intellectual Principles:**
- Article 44: Uniform Civil Code
- Article 45: Free and compulsory education for children (now fundamental right under 21A)
- Article 48A: Protection of environment, forests, and wildlife
- Article 49: Protection of monuments, places, objects of national importance
- Article 50: Separation of judiciary from executive
- Article 51: Promotion of international peace and security

## Fundamental Rights vs DPSP

| Aspect | Fundamental Rights | DPSP |
|--------|-------------------|------|
| Justiciability | Justiciable (enforceable in court) | Non-justiciable |
| Part of Constitution | Part III | Part IV |
| Articles | 12–35 | 36–51 |
| Nature | Negative (restrict State) | Positive (duty on State) |
| Purpose | Political democracy | Socio-economic democracy |

## Key Supreme Court Cases (UPSC Important)

1. **Golak Nath case (1967):** Parliament cannot amend FRs
2. **Kesavananda Bharati case (1973):** Parliament can amend FRs but not 'Basic Structure'
3. **Minerva Mills case (1980):** Balance between FRs and DPSPs; both essential
4. **Maneka Gandhi case (1978):** Article 21 interpreted broadly — right to live with dignity

## UPSC Exam Tips

- Article 21 has been expanded by courts to include: right to privacy, livelihood, health, education, clean environment
- Right to Property was removed from FRs by 44th Amendment (1978) — now Article 300A (legal right only)
- Article 32 itself is a Fundamental Right — cannot be suspended except during emergency`,
  },

  {
    title: 'Number Systems – CAT Quantitative Aptitude',
    contentType: 'markdown',
    metadata: {
      exam: 'CAT',
      subject: 'Quantitative Aptitude',
      topic: 'Number Systems',
      source: 'StudyGauge Core Content',
      difficulty: 'intermediate',
      tags: ['number theory', 'divisibility', 'LCM', 'HCF', 'remainders', 'CAT'],
      year: 2024,
    },
    rawContent: `# Number Systems – CAT Quantitative Aptitude

Number systems is one of the highest-weightage topics in CAT. Questions range from basic divisibility to advanced remainder theorems.

## Types of Numbers

- **Natural Numbers (N):** 1, 2, 3, ... (positive integers)
- **Whole Numbers (W):** 0, 1, 2, 3, ... (N + zero)
- **Integers (Z):** ..., -2, -1, 0, 1, 2, ... (includes negatives)
- **Rational Numbers (Q):** p/q where p, q are integers, q ≠ 0 (terminating or repeating decimals)
- **Irrational Numbers:** Cannot be expressed as p/q (e.g., √2, π, e)
- **Real Numbers (R):** Rationals + Irrationals
- **Prime Numbers:** Divisible only by 1 and themselves (2, 3, 5, 7, 11, ...)
- **Composite Numbers:** More than two factors

## Divisibility Rules

| Divisor | Rule |
|---------|------|
| 2 | Last digit even (0,2,4,6,8) |
| 3 | Sum of digits divisible by 3 |
| 4 | Last two digits divisible by 4 |
| 5 | Last digit 0 or 5 |
| 6 | Divisible by both 2 and 3 |
| 7 | Alternating subtraction of blocks of 3 digits |
| 8 | Last three digits divisible by 8 |
| 9 | Sum of digits divisible by 9 |
| 11 | Alternating sum of digits divisible by 11 |
| 12 | Divisible by both 3 and 4 |
| 25 | Last two digits 00, 25, 50, or 75 |

## HCF and LCM

**HCF (Highest Common Factor):** Largest number that divides all given numbers.
**LCM (Least Common Multiple):** Smallest number divisible by all given numbers.

**Key Relationship:** HCF × LCM = Product of two numbers (valid for exactly two numbers)

**Methods:**
- HCF by Euclid's Algorithm: HCF(a,b) = HCF(b, a mod b)
- LCM = (a × b) / HCF(a, b)

**CAT Applications:**
- HCF used in: dividing things into equal groups, finding largest tile size
- LCM used in: finding when events coincide again, smallest number divisible by multiple numbers

## Remainder Theorems

### Basic Remainder
Remainder when a^n is divided by m — use pattern finding (cyclicity).

**Example:** Find remainder when 7^100 is divided by 5.
- 7¹ mod 5 = 2, 7² mod 5 = 4, 7³ mod 5 = 3, 7⁴ mod 5 = 1 (cyclicity = 4)
- 100 mod 4 = 0 → remainder = 7⁴ mod 5 = 1

### Fermat's Little Theorem
If p is prime and HCF(a, p) = 1: **a^(p-1) ≡ 1 (mod p)**

### Euler's Theorem
If HCF(a, n) = 1: **a^φ(n) ≡ 1 (mod n)**
where φ(n) = Euler's totient function

**Euler's Totient:**
- φ(p) = p - 1 (p prime)
- φ(p^k) = p^k - p^(k-1)
- φ(mn) = φ(m)·φ(n) if HCF(m,n) = 1

### Chinese Remainder Theorem
Used to solve systems of congruences with coprime moduli.

## Number of Factors

For N = p^a · q^b · r^c ..., 
**Number of factors = (a+1)(b+1)(c+1)...**

**Sum of factors = [(p^(a+1) - 1)/(p-1)] × [(q^(b+1) - 1)/(q-1)] × ...**

**Example:** 360 = 2³ × 3² × 5¹
- Factors = (3+1)(2+1)(1+1) = 24

## Perfect Numbers and Special Types

- **Perfect Number:** Sum of proper divisors = number itself (e.g., 6 = 1+2+3; 28 = 1+2+4+7+14)
- **Co-prime Numbers:** HCF = 1 (need not be prime)
- **Twin Primes:** Primes differing by 2 (e.g., 11, 13; 17, 19)

## Cyclicity of Last Digits

| Last digit of base | Cyclicity |
|-------------------|-----------|
| 0, 1, 5, 6 | 1 |
| 4, 9 | 2 |
| 2, 3, 7, 8 | 4 |

## CAT Problem-Solving Strategies

1. **Factor-counting problems:** Always prime factorize first
2. **Remainder problems:** Look for pattern/cyclicity; use Fermat/Euler for primes
3. **HCF/LCM word problems:** Identify if "largest" → HCF or "smallest/together" → LCM
4. **Trailing zeros in n!:** Count min(factors of 2, factors of 5) = always factors of 5 = ⌊n/5⌋ + ⌊n/25⌋ + ⌊n/125⌋ + ...
5. **Sum of first n natural numbers:** n(n+1)/2`,
  },

  {
    title: 'Integration – JEE Mathematics',
    contentType: 'markdown',
    metadata: {
      exam: 'JEE',
      subject: 'Mathematics',
      topic: 'Integration',
      source: 'StudyGauge Core Content',
      difficulty: 'advanced',
      tags: ['calculus', 'integration', 'indefinite', 'definite', 'JEE Advanced'],
      year: 2024,
    },
    rawContent: `# Integration – JEE Mathematics

Integration is the inverse of differentiation and one of the most important topics for JEE Advanced. It has high weightage and requires both technique and strategic problem selection.

## Fundamental Theorem of Calculus

If F'(x) = f(x), then:
∫f(x)dx = F(x) + C (indefinite integral)
∫[a to b] f(x)dx = F(b) - F(a) (definite integral)

## Standard Integrals (Must Memorize)

∫x^n dx = x^(n+1)/(n+1) + C (n ≠ -1)
∫(1/x) dx = ln|x| + C
∫e^x dx = e^x + C
∫a^x dx = a^x/ln(a) + C
∫sin(x) dx = -cos(x) + C
∫cos(x) dx = sin(x) + C
∫sec²(x) dx = tan(x) + C
∫cosec²(x) dx = -cot(x) + C
∫sec(x)tan(x) dx = sec(x) + C
∫cosec(x)cot(x) dx = -cosec(x) + C
∫tan(x) dx = -ln|cos(x)| + C = ln|sec(x)| + C
∫cot(x) dx = ln|sin(x)| + C
∫1/(1+x²) dx = arctan(x) + C
∫1/√(1-x²) dx = arcsin(x) + C
∫1/(x²-a²) dx = (1/2a)ln|(x-a)/(x+a)| + C
∫1/√(x²+a²) dx = ln|x + √(x²+a²)| + C

## Key Integration Techniques

### 1. Substitution (u-substitution)
Replace variable to simplify: let u = g(x), then du = g'(x)dx

**Example:** ∫2x·cos(x²)dx → let u = x², du = 2x dx → ∫cos(u)du = sin(u) + C = sin(x²) + C

### 2. Integration by Parts
∫u·dv = u·v - ∫v·du

**LIATE Rule** (priority for choosing u):
L - Logarithmic, I - Inverse trig, A - Algebraic, T - Trigonometric, E - Exponential

**Example:** ∫x·e^x dx: u = x, dv = e^x dx → = x·e^x - ∫e^x dx = e^x(x-1) + C

### 3. Partial Fractions
For rational functions P(x)/Q(x) where degree(P) < degree(Q).

Types of factors in Q(x):
- Linear (ax+b): A/(ax+b)
- Repeated linear (ax+b)²: A/(ax+b) + B/(ax+b)²
- Irreducible quadratic (ax²+bx+c): (Ax+B)/(ax²+bx+c)

### 4. Trigonometric Integrals
**Key Substitutions:**
- √(a²-x²): x = a·sin(θ)
- √(a²+x²): x = a·tan(θ)
- √(x²-a²): x = a·sec(θ)

**Products of sin and cos:** Use power-reducing identities
- sin²x = (1-cos2x)/2
- cos²x = (1+cos2x)/2
- sin(x)cos(x) = sin(2x)/2

### 5. King's Property for Definite Integrals
∫[a to b] f(x)dx = ∫[a to b] f(a+b-x)dx

**Applications:** Used to simplify integrals involving sin, cos, ln, etc.

**Example:** ∫[0 to π] x·sin(x)/(1+cos²x) dx
Using King's property: I = ∫[0 to π] (π-x)·sin(x)/(1+cos²x) dx
Adding: 2I = π∫[0 to π] sin(x)/(1+cos²x) dx = π·arctan(cos x)|[0 to π] = π²/2
So I = π²/4

## Properties of Definite Integrals

1. ∫[a to b] f(x)dx = -∫[b to a] f(x)dx
2. ∫[a to a] f(x)dx = 0
3. ∫[a to b] f(x)dx = ∫[a to c] f(x)dx + ∫[c to b] f(x)dx (additivity)
4. If f is even: ∫[-a to a] f(x)dx = 2∫[0 to a] f(x)dx
5. If f is odd: ∫[-a to a] f(x)dx = 0
6. Periodic function with period T: ∫[0 to nT] f(x)dx = n·∫[0 to T] f(x)dx

## Area Under Curves

Area between curve and x-axis: A = |∫[a to b] f(x)dx|

Area between two curves: A = ∫[a to b] |f(x) - g(x)|dx

**JEE Strategy for Area Problems:**
1. Sketch the curves and find intersection points
2. Identify which curve is on top
3. Set up the integral(s) — may need to split at intersection points
4. Evaluate carefully

## JEE Advanced Problem Strategy

1. **Recognize standard forms** before attempting complex substitutions
2. **Check for even/odd** symmetry before computing — saves significant time
3. **King's property** is extremely powerful for trigonometric definite integrals
4. **Differentiation under integral sign** (Leibniz rule) for parameter-dependent integrals
5. Practice the **Walli's formula** for products of sin and cos over [0, π/2]`,
  },

  {
    title: 'Chemical Bonding and Molecular Structure – NEET Chemistry',
    contentType: 'text',
    metadata: {
      exam: 'NEET',
      subject: 'Chemistry',
      topic: 'Chemical Bonding',
      source: 'StudyGauge Core Content',
      difficulty: 'intermediate',
      tags: ['ionic bond', 'covalent bond', 'VSEPR', 'hybridization', 'molecular geometry'],
      year: 2024,
    },
    rawContent: `Chemical Bonding and Molecular Structure

Chemical bonding is the force of attraction that holds two atoms together. Understanding bonding types and molecular geometry is critical for NEET Chemistry.

Types of Chemical Bonds

Ionic Bond: Formed by complete transfer of electrons from a metal to a non-metal. Results in electrostatic attraction between oppositely charged ions. Example: NaCl (Na gives e- to Cl).

Characteristics of ionic compounds: High melting and boiling points, conduct electricity in molten state or aqueous solution, soluble in polar solvents, form crystal lattice structure.

Covalent Bond: Formed by sharing of electrons between two non-metals. Can be single (sharing 2 e-), double (sharing 4 e-), or triple (sharing 6 e-).

Bond order = (bonding electrons - antibonding electrons) / 2

Higher bond order = shorter bond length = greater bond energy

Coordinate/Dative Bond: Special covalent bond where both shared electrons come from the same atom (donor). Example: NH4+ (N donates lone pair to H+), BF3-NH3 complex.

Hydrogen Bond: Electrostatic attraction between H (bonded to F, O, or N) and electronegative atom. Explains anomalous properties of water, HF, and DNA base pairing.

Intramolecular H-bond: Within same molecule (e.g., o-nitrophenol) - lower boiling point
Intermolecular H-bond: Between different molecules (e.g., H2O, HF) - higher boiling point

VSEPR Theory (Valence Shell Electron Pair Repulsion)

Electron pairs around central atom arrange to minimize repulsion.

Repulsion order: Lone pair-lone pair > Lone pair-bond pair > Bond pair-bond pair

Common molecular geometries:

2 bond pairs, 0 lone pairs: Linear (180°) - Example: CO2, BeCl2
3 bond pairs, 0 lone pairs: Trigonal planar (120°) - Example: BF3, SO3
4 bond pairs, 0 lone pairs: Tetrahedral (109.5°) - Example: CH4, CCl4
3 bond pairs, 1 lone pair: Trigonal pyramidal (107°) - Example: NH3
2 bond pairs, 2 lone pairs: Bent/V-shaped (104.5°) - Example: H2O
5 bond pairs, 0 lone pairs: Trigonal bipyramidal (90°, 120°) - Example: PCl5
6 bond pairs, 0 lone pairs: Octahedral (90°) - Example: SF6

Hybridization

sp hybridization: Linear, 180°, 2 sigma bonds (Example: BeCl2, HC≡CH - each carbon sp)
sp2 hybridization: Trigonal planar, 120°, 3 sigma bonds (Example: BF3, C2H4 - each carbon sp2, one pi bond)
sp3 hybridization: Tetrahedral, 109.5°, 4 sigma bonds (Example: CH4, NH3, H2O)
sp3d hybridization: Trigonal bipyramidal (Example: PCl5)
sp3d2 hybridization: Octahedral (Example: SF6)

Note: Pi bonds are NOT included in hybridization count. Count sigma bonds + lone pairs to determine hybridization.

Bond Parameters

Bond length: Distance between nuclei of bonded atoms. Single > Double > Triple (bond length decreases as bond order increases).

Bond energy: Energy required to break one mole of bonds. Triple > Double > Single (bond energy increases as bond order increases).

Bond angle: Affected by lone pairs (decrease bond angle) and electronegativity of substituents.

NH3 (107°) vs NF3 (102°): F is more electronegative, pulls bonding pairs away from N, increasing lone pair repulsion, decreasing bond angle.

Dipole Moment and Polarity

Dipole moment (μ) = charge × bond length

Polar molecules: Have net dipole moment (e.g., HCl, H2O, NH3)
Non-polar molecules: Zero net dipole moment due to symmetry (e.g., CO2, CCl4, BF3)

CO2 is linear - two polar C=O bonds cancel (non-polar)
H2O is bent - two polar O-H bonds don't cancel (polar)

NEET Important: Molecules with same formula can differ in polarity based on geometry.

Molecular Orbital Theory (MOT)

Atomic orbitals combine to form molecular orbitals (bonding + antibonding).

MO order for O2, F2: σ1s, σ*1s, σ2s, σ*2s, σ2p, π2p, π2p, π*2p, π*2p, σ*2p

Bond order = (Nb - Na)/2 where Nb = bonding electrons, Na = antibonding electrons

Magnetic behavior: Molecules with unpaired electrons are paramagnetic; paired electrons = diamagnetic.
O2 bond order = (8-4)/2 = 2; O2 is paramagnetic (2 unpaired electrons in degenerate π* orbitals) — this is a landmark result of MOT that VSEPR fails to predict.`,
  },
];

async function main() {
  console.log('🌱 StudyGauge RAG Knowledge Base Seeder');
  console.log('========================================');
  console.log(`📡 Connecting to MongoDB: ${MONGO_URI.replace(/:[^@]+@/, ':***@')}`);

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  const hasEmbeddingKey = Boolean(
    process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  );
  if (!hasEmbeddingKey) {
    console.warn('⚠️  No GEMINI_API_KEY found — using mock embeddings (functional for testing, not semantic search quality)\n');
  } else {
    console.log(`🔑 Gemini API key found — using real text-embedding-004 embeddings\n`);
  }

  console.log(`📚 Ingesting ${DEMO_DOCUMENTS.length} demo knowledge documents...\n`);

  const { results, summary } = await ingestDocumentBatch(DEMO_DOCUMENTS, {
    continueOnError: true,
  });

  console.log('\n─────────────────────────────────────');
  console.log('📊 Ingestion Results:');
  console.log('─────────────────────────────────────');

  results.forEach((r, i) => {
    const icon = r.success ? (r.skipped ? '⏭️ ' : '✅') : '❌';
    const suffix = r.skipped
      ? '(already exists, skipped)'
      : r.success
      ? `→ ${r.totalChunks || 0} chunks`
      : `FAILED: ${r.message}`;
    console.log(`${icon} [${i + 1}] ${r.title} ${suffix}`);
  });

  console.log('\n─────────────────────────────────────');
  console.log(`✅ Success: ${summary.successCount}`);
  console.log(`⏭️  Skipped: ${summary.skippedCount}`);
  console.log(`❌ Failed:  ${summary.failedCount}`);
  console.log(`📄 Total:   ${summary.total}`);
  console.log('─────────────────────────────────────\n');

  if (!hasEmbeddingKey) {
    console.log('💡 Next steps for production quality:');
    console.log('   1. Add GEMINI_API_KEY to your .env file');
    console.log('   2. Re-run this script (duplicate detection via SHA-256 hash will skip already-ingested docs)');
    console.log('   3. Create Atlas Vector Search index on the knowledgechunks collection\n');
  }

  if (hasEmbeddingKey) {
    console.log('🔍 Atlas Vector Search Setup (if using MongoDB Atlas):');
    console.log('   Collection: knowledgechunks');
    console.log('   Index name: knowledgechunks_vector_index');
    console.log('   Field: embedding → type: vector, dimensions: 768, similarity: cosine');
    console.log('   Pre-filter fields: metadata.exam, metadata.subject, metadata.topic, metadata.difficulty\n');
  }

  await mongoose.disconnect();
  console.log('👋 Disconnected from MongoDB. Seeding complete!');
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
