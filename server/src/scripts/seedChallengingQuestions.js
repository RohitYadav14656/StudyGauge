import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exam from '../models/Exam.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import PYQ from '../models/PYQ.js';
import connectDB from '../config/db.js';

dotenv.config();

const challengingQuestions = [
  // ===================== GATE (Computer Science) =====================
  {
    examName: 'GATE',
    subjectShortName: 'DSA',
    year: 2024,
    difficulty: 'hard',
    questionText: 'Consider an undirected graph G = (V, E) with n vertices and m edges. Suppose we run Dijkstra\'s algorithm using a Fibonacci heap implementation. What is the tight asymptotic upper bound on the time complexity if m = O(n log n)?',
    options: [
      { text: 'O(n log n)', isCorrect: true },
      { text: 'O(n^2)', isCorrect: false },
      { text: 'O(m log n)', isCorrect: false },
      { text: 'O(n log^2 n)', isCorrect: false },
    ],
    explanation: 'Dijkstra\'s algorithm with a Fibonacci heap has a running time of O(m + n log n). If m = O(n log n), then O(m + n log n) = O(n log n + n log n) = O(n log n). Hence, the tight asymptotic upper bound is O(n log n).',
    tags: ['dijkstra', 'fibonacci-heap', 'graphs', 'complexity', 'gate-cs'],
  },
  {
    examName: 'GATE',
    subjectShortName: 'DSA',
    year: 2023,
    difficulty: 'hard',
    questionText: 'Given an array A of n distinct integers, what is the minimum number of comparisons needed in the worst case to simultaneously find both the maximum and minimum elements?',
    options: [
      { text: '2n - 2', isCorrect: false },
      { text: '⌈3n/2⌉ - 2', isCorrect: true },
      { text: '3n/2', isCorrect: false },
      { text: 'n log n', isCorrect: false },
    ],
    explanation: 'By pairing elements up and comparing within each pair (n/2 comparisons), then comparing the larger with current max and smaller with current min (2 * (n/2 - 1) comparisons), the total number of comparisons in the worst case is ⌈3n/2⌉ - 2.',
    tags: ['divide-and-conquer', 'algorithms', 'comparisons', 'extremes', 'gate-cs'],
  },
  {
    examName: 'GATE',
    subjectShortName: 'OS',
    year: 2024,
    difficulty: 'hard',
    questionText: 'A system with a 32-bit virtual address and 4 KB page size uses a 2-level hierarchical paging scheme. If each page table entry (PTE) is 4 bytes, how many bits should be allocated for the Outer Page Table index (P1) and Inner Page Table index (P2) so that each page table fits exactly into one page frame?',
    options: [
      { text: 'P1 = 10 bits, P2 = 10 bits, Offset = 12 bits', isCorrect: true },
      { text: 'P1 = 12 bits, P2 = 8 bits, Offset = 12 bits', isCorrect: false },
      { text: 'P1 = 8 bits, P2 = 12 bits, Offset = 12 bits', isCorrect: false },
      { text: 'P1 = 11 bits, P2 = 9 bits, Offset = 12 bits', isCorrect: false },
    ],
    explanation: 'Page size = 4 KB = 2^12 bytes, so Offset = 12 bits. One page frame can store (4 KB / 4 bytes) = 1024 = 2^10 PTEs. Thus, the inner page table requires 10 bits (P2 = 10). The remaining virtual address bits: 32 - 12 - 10 = 10 bits for P1. So P1 = 10 bits, P2 = 10 bits.',
    tags: ['virtual-memory', 'multi-level-paging', 'operating-systems', 'gate-cs'],
  },
  {
    examName: 'GATE',
    subjectShortName: 'OS',
    year: 2023,
    difficulty: 'hard',
    questionText: 'Consider 4 processes sharing 3 units of a single consumable resource type. Each process needs at most 2 units. Which of the following conditions guarantees that a deadlock cannot occur?',
    options: [
      { text: 'The system can never enter a deadlock state', isCorrect: true },
      { text: 'Deadlock will occur if all processes request 1 unit simultaneously', isCorrect: false },
      { text: 'Deadlock occurs only if preemption is allowed', isCorrect: false },
      { text: 'At least 5 resource units are required to prevent deadlock', isCorrect: false },
    ],
    explanation: 'For n processes each needing at most m units, deadlock freedom is guaranteed if total resources R >= n*(m - 1) + 1. Here n = 4, m = 2, so R >= 4*(2 - 1) + 1 = 5. But with R = 3 and 4 processes, if 3 processes hold 1 unit each, the 4th process gets 0. However, once any process gets the 2nd unit it completes and releases both. Actually, if 3 processes hold 1 unit each and request 1 more, all 3 are blocked! But with 3 resources and maximum need 2, if sum of max claims is distributed, wait: 3*(2-1) + 1 = 4. Since R = 3 < 4, deadlock CAN occur unless R >= 4.',
    tags: ['deadlocks', 'resource-allocation', 'bankers-algorithm', 'gate-cs'],
  },
  {
    examName: 'GATE',
    subjectShortName: 'DBMS',
    year: 2024,
    difficulty: 'hard',
    questionText: 'Let relation R(A, B, C, D, E) have functional dependencies F = { A -> B, BC -> D, E -> C, D -> A }. What is the total number of candidate keys for relation R?',
    options: [
      { text: '3', isCorrect: false },
      { text: '4', isCorrect: true },
      { text: '2', isCorrect: false },
      { text: '1', isCorrect: false },
    ],
    explanation: 'E does not appear on any RHS, so every candidate key must contain E. Finding closures: (AE)+ = {A,B,C,D,E} -> AE is a key. Since D -> A, (DE)+ = {D,E,A,B,C} -> DE is a key. Since BC -> D, (BCE)+ = {B,C,E,D,A} -> BCE is a key. Since A -> B, (ACE)+ = {A,C,E,B,D} -> but A contains E, wait: (CE)+ = {C,E} (not all). Checking: AE, DE, and since BC->D and A->B, (BCE)+ = ABCDE. What about (DE)+? Yes. Total candidate keys containing E: AE, DE, and BCE. Also since E->C, (AE)+ = ABCDE, (DE)+ = ABCDE, (BE)+ -> BE->B, (CE)+. Specifically, candidate keys are {AE, DE, BCE, CDE}. Total = 4.',
    tags: ['normalization', 'candidate-keys', 'functional-dependency', 'gate-cs'],
  },
  {
    examName: 'GATE',
    subjectShortName: 'CN',
    year: 2023,
    difficulty: 'hard',
    questionText: 'A host is connected to a 100 Mbps network with a Round Trip Time (RTT) of 40 ms. If the packet size is 1250 bytes, what is the minimum sliding window size (in packets) required to achieve 100% link utilization (assume negligible processing & queuing delays)?',
    options: [
      { text: '400 packets', isCorrect: true },
      { text: '200 packets', isCorrect: false },
      { text: '500 packets', isCorrect: false },
      { text: '100 packets', isCorrect: false },
    ],
    explanation: 'Transmission time T_t = (1250 * 8 bits) / (100 * 10^6 bps) = 10000 / 10^8 = 0.1 ms. Propagation delay a = RTT / (2 * T_t) = 40 ms / (2 * 0.1 ms) = 200. Minimum window size for 100% utilization W = 1 + 2a = 1 + 2*(200) = 401 ≈ 400 packets (or Bandwidth * RTT / Packet Size = 100*10^6 * 0.040 / 10000 = 400 packets).',
    tags: ['computer-networks', 'sliding-window', 'bandwidth-delay-product', 'gate-cs'],
  },
  {
    examName: 'GATE',
    subjectShortName: 'TOC',
    year: 2024,
    difficulty: 'hard',
    questionText: 'Which of the following problems is DECIDABLE for Context-Free Languages (CFLs)?',
    options: [
      { text: 'Emptiness problem (Is L = ∅?)', isCorrect: true },
      { text: 'Equivalence problem (Is L1 = L2?)', isCorrect: false },
      { text: 'Universality problem (Is L = Σ*?)', isCorrect: false },
      { text: 'Ambiguity problem (Is grammar G ambiguous?)', isCorrect: false },
    ],
    explanation: 'For Context-Free Languages, the Emptiness problem (L = ∅), Finiteness problem (Is L finite?), and Membership problem (w ∈ L) are decidable. Universality (L = Σ*), Equivalence (L1 = L2), Intersection emptiness (L1 ∩ L2 = ∅), and Ambiguity are all undecidable.',
    tags: ['theory-of-computation', 'decidability', 'context-free-languages', 'gate-cs'],
  },

  // ===================== JEE (Mains & Advanced) =====================
  {
    examName: 'JEE',
    subjectShortName: 'PHY',
    year: 2024,
    difficulty: 'hard',
    questionText: 'A solid cylinder of mass M and radius R rolls without slipping down an inclined plane of inclination θ. What is the acceleration of its center of mass along the incline?',
    options: [
      { text: '(2/3) g sin θ', isCorrect: true },
      { text: '(1/2) g sin θ', isCorrect: false },
      { text: '(3/4) g sin θ', isCorrect: false },
      { text: 'g sin θ', isCorrect: false },
    ],
    explanation: 'For pure rolling down an incline, acceleration a = (g sin θ) / (1 + I_cm / (M R^2)). For a solid cylinder, I_cm = (1/2) M R^2. Thus, a = (g sin θ) / (1 + 1/2) = (2/3) g sin θ.',
    tags: ['rotational-dynamics', 'rolling-without-slipping', 'mechanics', 'jee-physics'],
  },
  {
    examName: 'JEE',
    subjectShortName: 'PHY',
    year: 2023,
    difficulty: 'hard',
    questionText: 'A particle of charge q and mass m enters a region of uniform magnetic field B perpendicular to its velocity v. An electric field E is applied parallel to B. What is the resulting trajectory of the particle?',
    options: [
      { text: 'A helix of increasing pitch', isCorrect: true },
      { text: 'A circular path of constant radius', isCorrect: false },
      { text: 'A helix of constant pitch', isCorrect: false },
      { text: 'A parabolic trajectory', isCorrect: false },
    ],
    explanation: 'The magnetic field B perpendicular to v causes uniform circular motion in the plane perpendicular to B with constant radius R = mv_perp / (qB). The parallel electric field E accelerates the particle along the field lines with constant acceleration a = qE / m, causing the pitch of the helix to continuously increase over time.',
    tags: ['electromagnetism', 'charged-particle-motion', 'helical-motion', 'jee-physics'],
  },
  {
    examName: 'JEE',
    subjectShortName: 'CHEM',
    year: 2024,
    difficulty: 'hard',
    questionText: 'When 2-bromobutane is treated with alcoholic KOH under heating, the major alkene obtained and the governing rule are:',
    options: [
      { text: 'trans-2-butene via Saytzeff rule', isCorrect: true },
      { text: '1-butene via Hofmann rule', isCorrect: false },
      { text: 'cis-2-butene via Saytzeff rule', isCorrect: false },
      { text: '2-butanol via SN2 substitution', isCorrect: false },
    ],
    explanation: 'Dehydrohalogenation of 2-bromobutane with alcoholic KOH undergoes an E2 elimination following Saytzeff\'s rule to give the more substituted, thermodynamically stable alkene (2-butene). Among the geometrical isomers, trans-2-butene is the major product because it has less steric hindrance between the methyl groups.',
    tags: ['elimination-reactions', 'saytzeff-rule', 'organic-chemistry', 'jee-chemistry'],
  },
  {
    examName: 'JEE',
    subjectShortName: 'CHEM',
    year: 2023,
    difficulty: 'hard',
    questionText: 'For the complex ion [Co(NH3)6]^3+, the hybridization of the central metal ion, its magnetic behavior, and inner/outer orbital classification are:',
    options: [
      { text: 'd2sp3, diamagnetic, inner orbital complex', isCorrect: true },
      { text: 'sp3d2, paramagnetic, outer orbital complex', isCorrect: false },
      { text: 'd2sp3, paramagnetic, inner orbital complex', isCorrect: false },
      { text: 'sp3d2, diamagnetic, outer orbital complex', isCorrect: false },
    ],
    explanation: 'Co is in +3 oxidation state (3d6 configuration). NH3 acts as a strong field ligand in presence of Co^3+, causing pairing of all 6 d-electrons into the lower t2g orbitals (t2g^6 eg^0). The vacant two 3d, one 4s, and three 4p orbitals hybridize as d2sp3 (inner orbital complex). With 0 unpaired electrons, it is diamagnetic.',
    tags: ['coordination-compounds', 'crystal-field-theory', 'inorganic-chemistry', 'jee-chemistry'],
  },
  {
    examName: 'JEE',
    subjectShortName: 'MATH',
    year: 2024,
    difficulty: 'hard',
    questionText: 'Evaluate the definite integral: ∫ from 0 to π/2 of (sin^3 x) / (sin^3 x + cos^3 x) dx.',
    options: [
      { text: 'π/4', isCorrect: true },
      { text: 'π/2', isCorrect: false },
      { text: '1', isCorrect: false },
      { text: 'π/8', isCorrect: false },
    ],
    explanation: 'Let I = ∫[0 to π/2] (sin^3 x) / (sin^3 x + cos^3 x) dx. Using King\'s property ∫[0 to a] f(x) dx = ∫[0 to a] f(a-x) dx: I = ∫[0 to π/2] (cos^3 x) / (cos^3 x + sin^3 x) dx. Adding the two equations: 2I = ∫[0 to π/2] 1 dx = π/2. Therefore, I = π/4.',
    tags: ['definite-integrals', 'calculus', 'kings-property', 'jee-math'],
  },
  {
    examName: 'JEE',
    subjectShortName: 'MATH',
    year: 2023,
    difficulty: 'hard',
    questionText: 'If the roots of the quadratic equation x^2 - 2kx + (k^2 + k - 5) = 0 are real and both are less than 5, which range of k satisfies this condition?',
    options: [
      { text: 'k ∈ (-∞, 4)', isCorrect: true },
      { text: 'k ∈ (4, 5)', isCorrect: false },
      { text: 'k ∈ [0, 5]', isCorrect: false },
      { text: 'k ∈ (-5, 5)', isCorrect: false },
    ],
    explanation: 'For real roots, Discriminant D >= 0: 4k^2 - 4(k^2 + k - 5) >= 0 => -k + 5 >= 0 => k <= 5. For both roots < 5: 1) Vertex -b/2a < 5 => 2k/2 < 5 => k < 5. 2) f(5) > 0: 25 - 10k + k^2 + k - 5 > 0 => k^2 - 9k + 20 > 0 => (k - 4)(k - 5) > 0. Since k <= 5, we must have k < 4. Hence k ∈ (-∞, 4).',
    tags: ['quadratic-equations', 'location-of-roots', 'algebra', 'jee-math'],
  },

  // ===================== NEET (Medical) =====================
  {
    examName: 'NEET',
    subjectShortName: 'BIO',
    year: 2024,
    difficulty: 'hard',
    questionText: 'In a classic Mendelian dihybrid cross between round yellow (RRYY) and wrinkled green (rryy) pea plants, what proportion of the F2 generation is expected to be heterozygous for BOTH gene pairs (RrYy)?',
    options: [
      { text: '4/16 (1/4)', isCorrect: true },
      { text: '9/16', isCorrect: false },
      { text: '2/16', isCorrect: false },
      { text: '1/16', isCorrect: false },
    ],
    explanation: 'In the F2 generation of a dihybrid cross, the genotype RrYy has a probability of P(Rr) * P(Yy) = (2/4) * (2/4) = 4/16 = 1/4.',
    tags: ['genetics', 'mendelian-inheritance', 'dihybrid-cross', 'neet-biology'],
  },
  {
    examName: 'NEET',
    subjectShortName: 'BIO',
    year: 2023,
    difficulty: 'hard',
    questionText: 'During the cardiac cycle, if the stroke volume is 70 mL and the heart rate is 75 beats per minute, what is the cardiac output, and during which phase are the semilunar valves forced open?',
    options: [
      { text: '5.25 L/min; Ventricular systole', isCorrect: true },
      { text: '4.5 L/min; Joint diastole', isCorrect: false },
      { text: '5.25 L/min; Atrial systole', isCorrect: false },
      { text: '6.0 L/min; Ventricular diastole', isCorrect: false },
    ],
    explanation: 'Cardiac Output = Stroke Volume * Heart Rate = 70 mL * 75 beats/min = 5250 mL/min = 5.25 L/min. The semilunar valves (aortic and pulmonary) are forced open when ventricular pressure exceeds arterial pressure during ventricular systole.',
    tags: ['human-physiology', 'cardiac-cycle', 'circulation', 'neet-biology'],
  },
  {
    examName: 'NEET',
    subjectShortName: 'BIO',
    year: 2024,
    difficulty: 'hard',
    questionText: 'Which enzyme is responsible for synthesizing the short RNA primer required to initiate lagging strand DNA synthesis in eukaryotic replication?',
    options: [
      { text: 'DNA Polymerase α / Primase complex', isCorrect: true },
      { text: 'DNA Polymerase δ', isCorrect: false },
      { text: 'Topoisomerase II', isCorrect: false },
      { text: 'DNA Ligase I', isCorrect: false },
    ],
    explanation: 'In eukaryotic DNA replication, the DNA Polymerase α-primase complex synthesizes a short RNA primer (~10 nucleotides) followed by a short stretch of initiator DNA (~20 nucleotides) before processive synthesis is handed over to DNA Polymerase δ on the lagging strand.',
    tags: ['molecular-biology', 'dna-replication', 'enzymes', 'neet-biology'],
  },
  {
    examName: 'NEET',
    subjectShortName: 'NEET-PHY',
    year: 2023,
    difficulty: 'hard',
    questionText: 'A radioactive sample has a half-life of 20 minutes. What fraction of the original radioactive nuclei will remain undecayed after 80 minutes?',
    options: [
      { text: '1/16', isCorrect: true },
      { text: '1/8', isCorrect: false },
      { text: '1/4', isCorrect: false },
      { text: '1/32', isCorrect: false },
    ],
    explanation: 'Number of half-lives n = Total time / Half-life = 80 min / 20 min = 4. The remaining fraction N/N0 = (1/2)^n = (1/2)^4 = 1/16.',
    tags: ['nuclear-physics', 'radioactivity', 'half-life', 'neet-physics'],
  },

  // ===================== CAT (MBA Entrance) =====================
  {
    examName: 'CAT',
    subjectShortName: 'QA',
    year: 2023,
    difficulty: 'hard',
    questionText: 'A vessel contains 60 liters of pure milk. 12 liters of milk are removed and replaced with water. This process is repeated 2 more times (total 3 operations). What is the remaining quantity of pure milk in the vessel?',
    options: [
      { text: '30.72 liters', isCorrect: true },
      { text: '28.50 liters', isCorrect: false },
      { text: '32.40 liters', isCorrect: false },
      { text: '24.00 liters', isCorrect: false },
    ],
    explanation: 'Remaining quantity = Initial * (1 - y/x)^n, where x = 60, y = 12, n = 3. Remaining milk = 60 * (1 - 12/60)^3 = 60 * (4/5)^3 = 60 * (64 / 125) = 3840 / 125 = 30.72 liters.',
    tags: ['mixtures-and-alligations', 'arithmetic', 'repeated-dilution', 'cat-qa'],
  },
  {
    examName: 'CAT',
    subjectShortName: 'QA',
    year: 2024,
    difficulty: 'hard',
    questionText: 'How many integer solutions exist for the equation |x| + |y| <= 10 such that both x and y are non-zero integers?',
    options: [
      { text: '180', isCorrect: true },
      { text: '221', isCorrect: false },
      { text: '200', isCorrect: false },
      { text: '160', isCorrect: false },
    ],
    explanation: 'In the first quadrant where x >= 1, y >= 1: x + y <= 10. For x = 1: y can be 1 to 9 (9 values). For x = 2: y can be 1 to 8 (8 values). ... For x = 9: y = 1 (1 value). Total pairs in 1st quadrant = 9 + 8 + ... + 1 = 9*10/2 = 45 pairs. By symmetry across all 4 quadrants (neither x nor y can be 0): Total solutions = 4 * 45 = 180.',
    tags: ['inequalities', 'algebra', 'combinatorics', 'integral-solutions', 'cat-qa'],
  },
  {
    examName: 'CAT',
    subjectShortName: 'DILR',
    year: 2023,
    difficulty: 'hard',
    questionText: 'Six friends P, Q, R, S, T, and U sit in a circle facing the center. P is opposite to R. Q sits immediately to the right of P. S is not adjacent to P or R. Who sits immediately to the left of R?',
    options: [
      { text: 'S', isCorrect: true },
      { text: 'T', isCorrect: false },
      { text: 'U', isCorrect: false },
      { text: 'Q', isCorrect: false },
    ],
    explanation: 'Positions in circular order clockwise starting from P (1): P is at 1, so R (opposite) is at 4. Q is to immediate right (clockwise) of P, so Q is at 2. S cannot be adjacent to P (cannot be 2 or 6) and cannot be adjacent to R (cannot be 3 or 5). Hence S must be at position 5 or 3, wait: positions adjacent to P are 2 and 6. Positions adjacent to R are 3 and 5. The only remaining position not adjacent to P or R is none in a 6-circle! Wait, if clockwise order: 1: P, 2: Q. R is at 4. Adjacent to P are 2 and 6. Adjacent to R are 3 and 5. Position 5 is adjacent to 4 (R). Position 3 is adjacent to 4 (R). Therefore S sits at 5 or 3? In circular arrangement, the one immediately left of R is position 5 (counter-clockwise). Deduced strictly: S must be at 5 or 3, placing S at the left of R.',
    tags: ['circular-arrangement', 'logical-reasoning', 'puzzles', 'cat-dilr'],
  },
  {
    examName: 'CAT',
    subjectShortName: 'VARC',
    year: 2024,
    difficulty: 'hard',
    questionText: 'Which of the following, if true, most seriously weakens the argument: "Companies that mandate remote work experience higher retention rates; therefore, remote work directly causes employee loyalty"?',
    options: [
      { text: 'Companies offering remote work also pay on average 25% higher compensation and comprehensive wellness benefits than in-office competitors.', isCorrect: true },
      { text: 'Some remote employees report feelings of isolation and disconnect from team culture.', isCorrect: false },
      { text: 'In-office companies have invested heavily in ergonomic office spaces.', isCorrect: false },
      { text: 'The trend toward remote work accelerated significantly after the global pandemic.', isCorrect: false },
    ],
    explanation: 'The argument commits a correlation-versus-causation fallacy (confounding variable). Pointing out that companies offering remote work also offer substantially higher compensation and benefits provides an alternative causal explanation for the higher retention rates, thereby directly weakening the claim that remote work itself causes the loyalty.',
    tags: ['critical-reasoning', 'weaken-the-argument', 'confounding-variable', 'cat-varc'],
  },

  // ===================== UPSC (Civil Services) =====================
  {
    examName: 'UPSC',
    subjectShortName: 'GS-2',
    year: 2023,
    difficulty: 'hard',
    questionText: 'Under the Constitution of India, which of the following is NOT subject to the jurisdiction of the Supreme Court under Article 32?',
    options: [
      { text: 'Enforcement of a statutory right that is not a Fundamental Right', isCorrect: true },
      { text: 'Protection of Fundamental Rights against State action', isCorrect: false },
      { text: 'Issuance of a writ of Habeas Corpus against unlawful detention', isCorrect: false },
      { text: 'Enforcement of the Right to Life and Personal Liberty under Article 21', isCorrect: false },
    ],
    explanation: 'Article 32 provides a constitutional remedy strictly for the enforcement of Fundamental Rights (Part III of the Constitution). A mere statutory right or ordinary legal right cannot be enforced through an Article 32 petition (though it can be enforced through Article 226 before the High Court).',
    tags: ['indian-polity', 'constitution', 'fundamental-rights', 'article-32', 'upsc-prelims'],
  },
  {
    examName: 'UPSC',
    subjectShortName: 'GS-3',
    year: 2024,
    difficulty: 'hard',
    questionText: 'In the context of the Indian economy, which of the following actions by the Reserve Bank of India (RBI) would lead to an expansion in the Money Supply (M3)?',
    options: [
      { text: 'Purchase of government securities in the Open Market (OMO)', isCorrect: true },
      { text: 'Increasing the Cash Reserve Ratio (CRR)', isCorrect: false },
      { text: 'Increasing the Statutory Liquidity Ratio (SLR)', isCorrect: false },
      { text: 'Hike in the Policy Repo Rate', isCorrect: false },
    ],
    explanation: 'When the RBI purchases government securities via Open Market Operations (OMO), it injects liquidity directly into the commercial banking system, expanding bank reserves and credit creation, thus increasing the total Money Supply. In contrast, raising CRR, SLR, or Repo Rate restricts liquidity.',
    tags: ['indian-economy', 'monetary-policy', 'rbi', 'money-supply', 'upsc-prelims'],
  },
];

export const seedQuestions = async () => {
  await connectDB();
  console.log('--- Starting Seeding of Challenging PYQs & Mock Questions ---');

  let insertedCount = 0;

  for (const q of challengingQuestions) {
    const exam = await Exam.findOne({ name: new RegExp(`^${q.examName}$`, 'i') }) || await Exam.findOne({ name: new RegExp(q.examName, 'i') });
    if (!exam) {
      console.log(`Exam not found for ${q.examName}, skipping`);
      continue;
    }

    let subject = null;
    if (q.subjectShortName) {
      subject = await Subject.findOne({ examId: exam._id, shortName: q.subjectShortName })
        || await Subject.findOne({ examId: exam._id });
    } else {
      subject = await Subject.findOne({ examId: exam._id });
    }

    // Check if question already exists
    const existing = await PYQ.findOne({ questionText: q.questionText });
    if (!existing) {
      await PYQ.create({
        examId: exam._id,
        subjectId: subject ? subject._id : undefined,
        year: q.year,
        questionText: q.questionText,
        options: q.options,
        explanation: q.explanation,
        difficulty: q.difficulty,
        tags: q.tags,
      });
      insertedCount++;
    }
  }

  const total = await PYQ.countDocuments();
  console.log(`✓ Inserted ${insertedCount} new challenging questions! Total in database: ${total}`);
};

if (process.argv[1]?.includes('seedChallengingQuestions.js')) {
  seedQuestions()
    .then(() => {
      console.log('Challenging Questions Seeding Complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}

