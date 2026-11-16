import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exam from '../models/Exam.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import connectDB from '../config/db.js';

dotenv.config();

const allSyllabusData = {
  GATE: [
    {
      name: 'Data Structures and Algorithms',
      shortName: 'DSA',
      description: 'Arrays, linked lists, stacks, queues, trees, graphs, sorting, and dynamic programming',
      order: 1,
      weightage: 15,
      topics: [
        {
          name: 'Linear Data Structures',
          description: 'Arrays, Stacks, Queues, and Linked Lists',
          order: 1,
          subtopics: [
            { name: 'Array Operations & Memory Layout', order: 1 },
            { name: 'Stack & Queue Applications', order: 2 },
            { name: 'Singly and Doubly Linked Lists', order: 3 },
          ],
        },
        {
          name: 'Trees & Binary Search Trees',
          description: 'Binary trees, traversals, BST, and balanced trees',
          order: 2,
          subtopics: [
            { name: 'Binary Tree Traversals (Inorder, Preorder, Postorder)', order: 1 },
            { name: 'Binary Search Tree (Insertion, Deletion, Search)', order: 2 },
            { name: 'AVL Trees and Rotations', order: 3 },
            { name: 'B-Trees and B+ Trees', order: 4 },
          ],
        },
        {
          name: 'Graph Algorithms',
          description: 'BFS, DFS, shortest paths, and minimum spanning trees',
          order: 3,
          subtopics: [
            { name: 'Graph Representations (Adjacency Matrix & List)', order: 1 },
            { name: 'BFS and DFS Traversals', order: 2 },
            { name: "Dijkstra's & Bellman-Ford Shortest Path", order: 3 },
            { name: "Kruskal's and Prim's MST", order: 4 },
          ],
        },
        {
          name: 'Algorithm Design Techniques',
          description: 'Divide and conquer, greedy, and dynamic programming',
          order: 4,
          subtopics: [
            { name: 'Asymptotic Notations (Big-O, Omega, Theta)', order: 1 },
            { name: 'Merge Sort, Quick Sort, Heap Sort', order: 2 },
            { name: 'Dynamic Programming (0/1 Knapsack, LCS, Matrix Chain)', order: 3 },
          ],
        },
      ],
    },
    {
      name: 'Operating Systems',
      shortName: 'OS',
      description: 'Process management, synchronization, deadlocks, and virtual memory',
      order: 2,
      weightage: 12,
      topics: [
        {
          name: 'Process Management & Scheduling',
          description: 'Processes, threads, and CPU scheduling algorithms',
          order: 1,
          subtopics: [
            { name: 'Process States and PCB', order: 1 },
            { name: 'Preemptive vs Non-Preemptive Scheduling (FCFS, SJF, RR)', order: 2 },
            { name: 'Multithreading and Context Switching', order: 3 },
          ],
        },
        {
          name: 'Process Synchronization',
          description: 'Critical section problem, semaphores, and classic sync problems',
          order: 2,
          subtopics: [
            { name: 'Critical Section Problem & Peterson Algorithm', order: 1 },
            { name: 'Semaphores (Counting and Binary)', order: 2 },
            { name: 'Producer-Consumer & Dining Philosophers Problem', order: 3 },
          ],
        },
        {
          name: 'Deadlocks',
          description: 'Deadlock conditions, prevention, avoidance, and Banker Algorithm',
          order: 3,
          subtopics: [
            { name: 'Four Necessary Conditions for Deadlock', order: 1 },
            { name: "Banker's Algorithm for Deadlock Avoidance", order: 2 },
            { name: 'Deadlock Detection and Recovery', order: 3 },
          ],
        },
        {
          name: 'Memory Management & Virtual Memory',
          description: 'Paging, segmentation, TLB, page replacement',
          order: 4,
          subtopics: [
            { name: 'Contiguous vs Non-Contiguous Allocation', order: 1 },
            { name: 'Paging and Multi-level Paging', order: 2 },
            { name: 'Page Replacement Algorithms (FIFO, LRU, Optimal)', order: 3 },
          ],
        },
      ],
    },
    {
      name: 'Database Management Systems',
      shortName: 'DBMS',
      description: 'Relational algebra, SQL, normalization, transactions, and indexing',
      order: 3,
      weightage: 10,
      topics: [
        {
          name: 'ER Modeling & Relational Model',
          description: 'Entity relationship diagrams, relational algebra, and calculus',
          order: 1,
          subtopics: [
            { name: 'ER Diagrams, Keys and Constraints', order: 1 },
            { name: 'Relational Algebra Operators', order: 2 },
            { name: 'Tuple Relational Calculus', order: 3 },
          ],
        },
        {
          name: 'SQL & Query Optimization',
          description: 'DDL, DML, joins, subqueries, and aggregate functions',
          order: 2,
          subtopics: [
            { name: 'SELECT, JOIN (Inner, Outer, Self)', order: 1 },
            { name: 'Subqueries and Correlated Subqueries', order: 2 },
            { name: 'GROUP BY, HAVING, and Aggregate Functions', order: 3 },
          ],
        },
        {
          name: 'Database Normalization',
          description: 'Functional dependencies, 1NF, 2NF, 3NF, BCNF, lossless joins',
          order: 3,
          subtopics: [
            { name: 'Closure of Attribute Sets and Candidate Keys', order: 1 },
            { name: '1NF, 2NF, 3NF, and BCNF Decomposition', order: 2 },
            { name: 'Lossless Decomposition and Dependency Preservation', order: 3 },
          ],
        },
        {
          name: 'Transactions & Concurrency Control',
          description: 'ACID properties, serializability, two-phase locking, and recovery',
          order: 4,
          subtopics: [
            { name: 'ACID Properties of Transactions', order: 1 },
            { name: 'Conflict and View Serializability', order: 2 },
            { name: 'Two-Phase Locking (2PL) and Strict 2PL', order: 3 },
          ],
        },
      ],
    },
    {
      name: 'Computer Networks',
      shortName: 'CN',
      description: 'OSI/TCP-IP layers, flow control, IP addressing, routing, and TCP/UDP',
      order: 4,
      weightage: 10,
      topics: [
        {
          name: 'Data Link Layer',
          description: 'Framing, error detection, flow control, and sliding window protocols',
          order: 1,
          subtopics: [
            { name: 'CRC Error Detection & Hamming Codes', order: 1 },
            { name: 'Stop-and-Wait, Go-Back-N, Selective Repeat', order: 2 },
            { name: 'CSMA/CD and Ethernet Protocols', order: 3 },
          ],
        },
        {
          name: 'Network Layer & IP Addressing',
          description: 'IPv4, IPv6, CIDR subnetting, and routing algorithms',
          order: 2,
          subtopics: [
            { name: 'IPv4 Addressing, Subnetting, and CIDR', order: 1 },
            { name: 'Distance Vector and Link State Routing', order: 2 },
            { name: 'ARP, DHCP, and ICMP Protocols', order: 3 },
          ],
        },
        {
          name: 'Transport Layer Protocols',
          description: 'TCP 3-way handshake, flow control, congestion control, and UDP',
          order: 3,
          subtopics: [
            { name: 'TCP Header and 3-Way Handshake', order: 1 },
            { name: 'TCP Congestion Control (Slow Start, Congestion Avoidance)', order: 2 },
            { name: 'UDP vs TCP Comparison', order: 3 },
          ],
        },
      ],
    },
    {
      name: 'Theory of Computation & Compilers',
      shortName: 'TOC',
      description: 'Regular expressions, finite automata, CFG, Turing machines, and parsing',
      order: 5,
      weightage: 10,
      topics: [
        {
          name: 'Finite Automata & Regular Languages',
          description: 'DFA, NFA, regular expressions, and pumping lemma',
          order: 1,
          subtopics: [
            { name: 'DFA and NFA Equivalences & Minimization', order: 1 },
            { name: 'Regular Expressions and Grammars', order: 2 },
            { name: 'Pumping Lemma for Regular Languages', order: 3 },
          ],
        },
        {
          name: 'Context-Free Grammars & Pushdown Automata',
          description: 'CFGs, parsing, ambiguity, and PDA',
          order: 2,
          subtopics: [
            { name: 'CFG Derivations and Ambiguity', order: 1 },
            { name: 'Deterministic and Non-Deterministic PDA', order: 2 },
            { name: 'Chomsky Normal Form (CNF)', order: 3 },
          ],
        },
        {
          name: 'Turing Machines & Decidability',
          description: 'Turing machine models, decidable and undecidable problems',
          order: 3,
          subtopics: [
            { name: 'Turing Machine Definitions and Transitions', order: 1 },
            { name: 'Halting Problem and Undecidability', order: 2 },
            { name: 'Rice Theorem and Reducibility', order: 3 },
          ],
        },
      ],
    },
  ],

  JEE: [
    {
      name: 'Physics',
      shortName: 'PHY',
      description: 'Classical mechanics, electrodynamics, optics, thermodynamics, and modern physics',
      order: 1,
      weightage: 33,
      topics: [
        {
          name: 'Mechanics & Rotational Dynamics',
          description: "Newton's laws, work-energy, center of mass, rotational inertia, and torque",
          order: 1,
          subtopics: [
            { name: "Newton's Laws of Motion & Friction", order: 1 },
            { name: 'Work, Energy, Power & Conservation Laws', order: 2 },
            { name: 'Moment of Inertia, Torque & Angular Momentum', order: 3 },
            { name: 'Gravitation & Planetary Motion (Kepler Laws)', order: 4 },
          ],
        },
        {
          name: 'Electrodynamics & Magnetism',
          description: "Coulomb's law, Gauss's law, circuits, magnetic fields, and EMI",
          order: 2,
          subtopics: [
            { name: "Electrostatics: Gauss's Law & Electric Potential", order: 1 },
            { name: "Current Electricity: Kirchhoff's Laws & Circuits", order: 2 },
            { name: 'Biot-Savart Law & Ampere Circuital Law', order: 3 },
            { name: 'Electromagnetic Induction & Alternating Currents (AC)', order: 4 },
          ],
        },
        {
          name: 'Optics & Wave Motion',
          description: 'Geometrical optics, wave optics, interference, diffraction, and Doppler effect',
          order: 3,
          subtopics: [
            { name: 'Ray Optics: Reflection, Refraction, Lenses & Mirrors', order: 1 },
            { name: 'Wave Optics: Interference (YDSE) & Diffraction', order: 2 },
            { name: 'Simple Harmonic Motion (SHM) & Resonance', order: 3 },
          ],
        },
        {
          name: 'Thermodynamics & Modern Physics',
          description: 'Kinetic theory of gases, heat engines, photoelectric effect, and nuclear physics',
          order: 4,
          subtopics: [
            { name: 'First & Second Laws of Thermodynamics & Carnot Cycle', order: 1 },
            { name: 'Photoelectric Effect & Dual Nature of Radiation', order: 2 },
            { name: "Bohr's Atomic Model & Radioactive Decay", order: 3 },
          ],
        },
      ],
    },
    {
      name: 'Chemistry',
      shortName: 'CHEM',
      description: 'Physical, organic, and inorganic chemistry principles',
      order: 2,
      weightage: 33,
      topics: [
        {
          name: 'Physical Chemistry',
          description: 'Atomic structure, chemical equilibrium, thermodynamics, and electrochemistry',
          order: 1,
          subtopics: [
            { name: 'Mole Concept & Stoichiometry', order: 1 },
            { name: 'Chemical Equilibrium & Ionic Equilibrium (pH, Buffers)', order: 2 },
            { name: 'Chemical Kinetics & Arrhenius Equation', order: 3 },
            { name: 'Electrochemistry: Nernst Equation & Galvanic Cells', order: 4 },
          ],
        },
        {
          name: 'Organic Chemistry',
          description: 'Reaction mechanisms, hydrocarbons, carbonyl compounds, and stereochemistry',
          order: 2,
          subtopics: [
            { name: 'IUPAC Nomenclature & General Organic Chemistry (GOC)', order: 1 },
            { name: 'Isomerism & Stereochemistry (Optical, Geometrical)', order: 2 },
            { name: 'Reaction Mechanisms (SN1, SN2, E1, E2)', order: 3 },
            { name: 'Aldehydes, Ketones, Carboxylic Acids & Amines', order: 4 },
          ],
        },
        {
          name: 'Inorganic Chemistry',
          description: 'Periodic table trends, chemical bonding, coordination compounds, and p-block',
          order: 3,
          subtopics: [
            { name: 'Periodic Properties & Chemical Bonding (VSEPR, MOT)', order: 1 },
            { name: 'Coordination Chemistry (Crystal Field Theory, Isomerism)', order: 2 },
            { name: 'p-Block Elements & Metallurgy', order: 3 },
          ],
        },
      ],
    },
    {
      name: 'Mathematics',
      shortName: 'MATH',
      description: 'Calculus, algebra, coordinate geometry, vectors, and 3D geometry',
      order: 3,
      weightage: 34,
      topics: [
        {
          name: 'Differential & Integral Calculus',
          description: 'Limits, continuity, derivatives, definite integrals, and differential equations',
          order: 1,
          subtopics: [
            { name: 'Limits, Continuity & Differentiability', order: 1 },
            { name: 'Applications of Derivatives (Maxima, Minima, Tangents)', order: 2 },
            { name: 'Definite Integrals & Area Under the Curve', order: 3 },
            { name: 'First Order Differential Equations', order: 4 },
          ],
        },
        {
          name: 'Coordinate Geometry & Conic Sections',
          description: 'Straight lines, circles, parabolas, ellipses, and hyperbolas',
          order: 2,
          subtopics: [
            { name: 'Straight Lines & Pair of Straight Lines', order: 1 },
            { name: 'Circles: Tangents, Normals & Chords', order: 2 },
            { name: 'Parabola, Ellipse & Hyperbola Standard Equations', order: 3 },
          ],
        },
        {
          name: 'Vectors, 3D Geometry & Matrices',
          description: 'Dot and cross product, 3D lines, planes, matrices, and determinants',
          order: 3,
          subtopics: [
            { name: 'Vectors: Dot Product, Cross Product & Triple Products', order: 1 },
            { name: '3D Geometry: Lines, Planes & Shortest Distance', order: 2 },
            { name: 'Matrices, Determinants & System of Linear Equations', order: 3 },
            { name: 'Complex Numbers & Quadratic Equations', order: 4 },
          ],
        },
      ],
    },
  ],

  NEET: [
    {
      name: 'Biology (Botany & Zoology)',
      shortName: 'BIO',
      description: 'Genetics, human physiology, plant physiology, cell biology, and ecology',
      order: 1,
      weightage: 50,
      topics: [
        {
          name: 'Genetics & Molecular Biology',
          description: 'Mendelian inheritance, DNA replication, transcription, translation, and genetic code',
          order: 1,
          subtopics: [
            { name: 'Mendel Laws of Inheritance & Pedigree Analysis', order: 1 },
            { name: 'Structure of DNA & RNA, Replication Mechanism', order: 2 },
            { name: 'Transcription, Translation & Lac Operon Concept', order: 3 },
            { name: 'Genetic Disorders & Chromosomal Aberrations', order: 4 },
          ],
        },
        {
          name: 'Human Physiology',
          description: 'Digestion, respiration, circulatory, excretory, nervous, and endocrine systems',
          order: 2,
          subtopics: [
            { name: 'Breathing & Gas Exchange Mechanism', order: 1 },
            { name: 'Human Circulatory System & Cardiac Cycle', order: 2 },
            { name: 'Excretion: Nephron Structure & Urine Formation', order: 3 },
            { name: 'Neural Control & Hormonal Coordination', order: 4 },
          ],
        },
        {
          name: 'Plant Physiology & Reproduction',
          description: 'Photosynthesis (C3/C4), cellular respiration, plant hormones, and pollination',
          order: 3,
          subtopics: [
            { name: 'Photosynthesis in Higher Plants (Light & Dark Reactions)', order: 1 },
            { name: 'Respiration in Plants (Glycolysis & Krebs Cycle)', order: 2 },
            { name: 'Plant Growth Regulators (Auxin, Cytokinin, Gibberellin)', order: 3 },
            { name: 'Sexual Reproduction in Flowering Plants (Double Fertilization)', order: 4 },
          ],
        },
        {
          name: 'Ecology, Evolution & Biotechnology',
          description: 'Population interactions, ecosystems, evolutionary theories, and recombinant DNA',
          order: 4,
          subtopics: [
            { name: 'Organisms & Populations (Adaptations, Population Growth)', order: 1 },
            { name: 'Ecosystem Energy Flow & Biogeochemical Cycles', order: 2 },
            { name: 'Biotechnology: Principles & Recombinant DNA Technology', order: 3 },
          ],
        },
      ],
    },
    {
      name: 'Physics for NEET',
      shortName: 'NEET-PHY',
      description: 'Mechanics, electrostatics, optics, thermodynamics, and modern physics',
      order: 2,
      weightage: 25,
      topics: [
        {
          name: 'Mechanics & Properties of Matter',
          description: 'Kinematics, dynamics, gravitation, fluids, and elasticity',
          order: 1,
          subtopics: [
            { name: "Kinematics & Newton's Laws of Motion", order: 1 },
            { name: 'Work, Energy & Power Theorems', order: 2 },
            { name: "Fluid Mechanics: Bernoulli's Theorem & Pascal Law", order: 3 },
          ],
        },
        {
          name: 'Electrodynamics & Optics',
          description: 'Current electricity, electrostatics, magnetic effects, and ray optics',
          order: 2,
          subtopics: [
            { name: "Electric Potential, Capacitors & Ohm's Law", order: 1 },
            { name: 'Magnetic Field Due to Current & Moving Charges', order: 2 },
            { name: 'Lenses, Mirrors, Microscopes & Wave Interference', order: 3 },
          ],
        },
      ],
    },
    {
      name: 'Chemistry for NEET',
      shortName: 'NEET-CHEM',
      description: 'Physical, organic, and inorganic chemistry tailored to medical entrance',
      order: 3,
      weightage: 25,
      topics: [
        {
          name: 'Organic Chemistry & Biomolecules',
          description: 'Basic principles, hydrocarbons, oxygen-containing compounds, and biomolecules',
          order: 1,
          subtopics: [
            { name: 'GOC, Resonance, Inductive & Hyperconjugation', order: 1 },
            { name: 'Alcohols, Phenols, Ethers, Aldehydes & Ketones', order: 2 },
            { name: 'Amino Acids, Proteins, Carbohydrates & Nucleic Acids', order: 3 },
          ],
        },
        {
          name: 'Inorganic & Physical Chemistry',
          description: 'Coordination chemistry, equilibrium, chemical kinetics, and solutions',
          order: 2,
          subtopics: [
            { name: 'Periodic Trends & Chemical Bonding', order: 1 },
            { name: 'Ionic Equilibrium & Solution Colligative Properties', order: 2 },
            { name: 'Electrochemistry & Rate of Reaction', order: 3 },
          ],
        },
      ],
    },
  ],

  CAT: [
    {
      name: 'Quantitative Aptitude',
      shortName: 'QA',
      description: 'Arithmetic, algebra, geometry, number systems, and modern mathematics',
      order: 1,
      weightage: 34,
      topics: [
        {
          name: 'Arithmetic',
          description: 'Percentages, profit & loss, ratios, time & work, and time-speed-distance',
          order: 1,
          subtopics: [
            { name: 'Percentages, Profit, Loss & Discount', order: 1 },
            { name: 'Simple & Compound Interest', order: 2 },
            { name: 'Ratios, Proportions & Alligation Mixtures', order: 3 },
            { name: 'Time, Speed, Distance, Trains & Races', order: 4 },
            { name: 'Time & Work, Pipes & Cisterns', order: 5 },
          ],
        },
        {
          name: 'Algebra',
          description: 'Linear & quadratic equations, inequalities, logarithms, and functions',
          order: 2,
          subtopics: [
            { name: 'Quadratic Equations & Roots Analysis', order: 1 },
            { name: 'Linear Inequalities & Modulus Functions', order: 2 },
            { name: 'Logarithms, Surds & Indices', order: 3 },
            { name: 'Sequences, Series (AP, GP, HP) & Progressions', order: 4 },
          ],
        },
        {
          name: 'Geometry & Mensuration',
          description: 'Triangles, circles, quadrilaterals, polygons, and 3D solid mensuration',
          order: 3,
          subtopics: [
            { name: 'Triangles: Similarity, Congruence, Centers & Theorems', order: 1 },
            { name: 'Circles: Tangents, Chords, Secants & Inscribed Angles', order: 2 },
            { name: 'Coordinate Geometry: Lines & Distances', order: 3 },
          ],
        },
        {
          name: 'Number Systems & Modern Math',
          description: 'Divisibility rules, remainders, factors, permutations, and probability',
          order: 4,
          subtopics: [
            { name: 'Divisibility, Remainder Theorem & Prime Factorization', order: 1 },
            { name: 'Permutations & Combinations (P&C)', order: 2 },
            { name: 'Probability & Conditional Probability', order: 3 },
          ],
        },
      ],
    },
    {
      name: 'Data Interpretation & Logical Reasoning',
      shortName: 'DILR',
      description: 'Tables, graphs, caselets, arrangements, puzzles, and Venn diagrams',
      order: 2,
      weightage: 33,
      topics: [
        {
          name: 'Data Interpretation (DI)',
          description: 'Bar charts, pie charts, radar graphs, complex tables, and caselets',
          order: 1,
          subtopics: [
            { name: 'Tables & Missing Data Interpretation', order: 1 },
            { name: 'Bar Graphs, Line Charts & Multi-Layer Pie Charts', order: 2 },
            { name: 'Caselets & Narrative-Based Calculations', order: 3 },
          ],
        },
        {
          name: 'Logical Reasoning (LR)',
          description: 'Seating arrangements, matrix matching, binary logic, and network games',
          order: 2,
          subtopics: [
            { name: 'Linear & Circular Seating Arrangements', order: 1 },
            { name: 'Grouping, Scheduling & Matrix Puzzles', order: 2 },
            { name: 'Tournament Schedules & Match Progression Sets', order: 3 },
            { name: 'Set Theory & 3-Set / 4-Set Venn Diagrams', order: 4 },
          ],
        },
      ],
    },
    {
      name: 'Verbal Ability & Reading Comprehension',
      shortName: 'VARC',
      description: 'RC passages, paragraph summary, parajumbles, and sentence completion',
      order: 3,
      weightage: 33,
      topics: [
        {
          name: 'Reading Comprehension (RC)',
          description: 'Philosophical, economic, scientific, sociological, and arts passages',
          order: 1,
          subtopics: [
            { name: 'Inference-Based & Central Theme Questions', order: 1 },
            { name: 'Author Tone, Primary Purpose & Critical Evaluation', order: 2 },
            { name: 'Strengthening & Weakening the Argument', order: 3 },
          ],
        },
        {
          name: 'Verbal Ability',
          description: 'Parajumbles, odd-sentence-out, paragraph summary, and completion',
          order: 2,
          subtopics: [
            { name: 'Para Jumbles (TITA & MCQ)', order: 1 },
            { name: 'Odd Sentence Out / Out of Context', order: 2 },
            { name: 'Paragraph Summary & Main Idea Synthesis', order: 3 },
          ],
        },
      ],
    },
  ],

  UPSC: [
    {
      name: 'General Studies I',
      shortName: 'GS-1',
      description: 'Indian history, art & culture, world history, and physical geography',
      order: 1,
      weightage: 25,
      topics: [
        {
          name: 'Indian Heritage, Art & Culture',
          description: 'Architecture, sculpture, classical dance forms, music, and literature',
          order: 1,
          subtopics: [
            { name: 'Temple Architecture & Ancient Sculptures', order: 1 },
            { name: 'Indian Classical Music, Dance & Folk Traditions', order: 2 },
          ],
        },
        {
          name: 'Modern Indian History & Freedom Struggle',
          description: 'British rule, revolts, 1857 mutiny, Congress phases, and partition',
          order: 2,
          subtopics: [
            { name: 'Revolt of 1857 & Early Resistance Movements', order: 1 },
            { name: 'Gandhian Era Movements (NCM, CDM, Quit India)', order: 2 },
            { name: 'Constitutional Developments under British Rule', order: 3 },
          ],
        },
        {
          name: 'Physical & Human Geography',
          description: 'Geomorphology, climatology, oceanography, resources, and demographic patterns',
          order: 3,
          subtopics: [
            { name: 'Plate Tectonics, Earthquakes & Volcanoes', order: 1 },
            { name: 'Indian Monsoon Mechanism & Cyclones', order: 2 },
            { name: 'Resource Distribution (Minerals, Agriculture, Water)', order: 3 },
          ],
        },
      ],
    },
    {
      name: 'General Studies II',
      shortName: 'GS-2',
      description: 'Indian Constitution, polity, governance, social justice, and international relations',
      order: 2,
      weightage: 25,
      topics: [
        {
          name: 'Indian Constitution & Political System',
          description: 'Preamble, Fundamental Rights, DPSP, Parliament, Judiciary, and Federalism',
          order: 1,
          subtopics: [
            { name: 'Fundamental Rights (Articles 12-35) & Writs', order: 1 },
            { name: 'Parliamentary System, Legislative Procedure & Committees', order: 2 },
            { name: 'Judicial Review & Basic Structure Doctrine', order: 3 },
            { name: 'Centre-State Relations & Fiscal Federalism', order: 4 },
          ],
        },
        {
          name: 'Governance & International Relations',
          description: 'E-governance, citizen charters, bilateral relations, and global groupings',
          order: 2,
          subtopics: [
            { name: 'Transparency, Accountability, RTI & Citizen Charters', order: 1 },
            { name: 'India and its Neighborhood Relations', order: 2 },
            { name: 'Bilateral & Multilateral Groupings (G20, QUAD, BRICS, UN)', order: 3 },
          ],
        },
      ],
    },
    {
      name: 'General Studies III',
      shortName: 'GS-3',
      description: 'Economy, agriculture, environment, science & tech, and internal security',
      order: 3,
      weightage: 25,
      topics: [
        {
          name: 'Indian Economy & Inclusive Growth',
          description: 'GDP growth, fiscal policy, taxation, inflation, banking, and budget',
          order: 1,
          subtopics: [
            { name: 'Monetary Policy Committee & Inflation Targeting', order: 1 },
            { name: 'Fiscal Deficit, GST & Budgeting Process', order: 2 },
            { name: 'Agricultural Subsidies, MSP & Food Security', order: 3 },
          ],
        },
        {
          name: 'Environment, Science & Security',
          description: 'Climate change, biodiversity, cyber security, and disaster management',
          order: 2,
          subtopics: [
            { name: 'UNFCCC COP Agreements & Renewable Energy Targets', order: 1 },
            { name: 'Cyber Security, AI & Emerging Space Technologies', order: 2 },
            { name: 'Border Management, Terrorism & Internal Security', order: 3 },
          ],
        },
      ],
    },
    {
      name: 'CSAT (Paper II)',
      shortName: 'CSAT',
      description: 'Reading comprehension, logical reasoning, and basic numeracy for prelims',
      order: 4,
      weightage: 25,
      topics: [
        {
          name: 'Reading Comprehension',
          description: 'Analytical passages, logical assumptions, and author arguments',
          order: 1,
          subtopics: [
            { name: 'Critical Assumption & Implication Identification', order: 1 },
            { name: 'Passage Inferences & Conclusions', order: 2 },
          ],
        },
        {
          name: 'Reasoning & Numeracy',
          description: 'Data sufficiency, series, permutations, ratios, and syllogisms',
          order: 2,
          subtopics: [
            { name: 'Data Sufficiency & Puzzles', order: 1 },
            { name: 'Number Series, Clocks & Calendars', order: 2 },
          ],
        },
      ],
    },
  ],

  'SSC CGL': [
    {
      name: 'Quantitative Aptitude',
      shortName: 'SSC-QA',
      description: 'Arithmetic and advanced mathematics for staff selection commission',
      order: 1,
      weightage: 25,
      topics: [
        {
          name: 'Arithmetic Mathematics',
          description: 'Percentages, profit & loss, ratio & proportion, time & work, SI & CI',
          order: 1,
          subtopics: [
            { name: 'Profit, Loss, and Discount', order: 1 },
            { name: 'Time, Distance, Speed, and Trains', order: 2 },
            { name: 'Averages, Ratios, and Mixtures', order: 3 },
          ],
        },
        {
          name: 'Advanced Mathematics',
          description: 'Algebra, trigonometry, geometry, and coordinate geometry',
          order: 2,
          subtopics: [
            { name: 'Algebraic Identities and Factorization', order: 1 },
            { name: 'Trigonometric Ratios, Heights & Distances', order: 2 },
            { name: 'Triangles, Circles, and Mensuration 2D/3D', order: 3 },
          ],
        },
      ],
    },
    {
      name: 'General Intelligence & Reasoning',
      shortName: 'SSC-REAS',
      description: 'Verbal and non-verbal reasoning, series, analogies, and coding-decoding',
      order: 2,
      weightage: 25,
      topics: [
        {
          name: 'Verbal Reasoning',
          description: 'Analogies, syllogisms, blood relations, and direction sense',
          order: 1,
          subtopics: [
            { name: 'Coding, Decoding, and Number Series', order: 1 },
            { name: 'Blood Relations and Direction Sense Tests', order: 2 },
            { name: 'Syllogisms and Venn Diagrams', order: 3 },
          ],
        },
        {
          name: 'Non-Verbal Reasoning',
          description: 'Mirror images, paper folding, embedded figures, and pattern completion',
          order: 2,
          subtopics: [
            { name: 'Mirror & Water Images', order: 1 },
            { name: 'Paper Folding and Cutting', order: 2 },
          ],
        },
      ],
    },
    {
      name: 'English Comprehension',
      shortName: 'SSC-ENG',
      description: 'Grammar, vocabulary, idioms, one-word substitution, and reading comprehension',
      order: 3,
      weightage: 25,
      topics: [
        {
          name: 'Grammar & Usage',
          description: 'Spotting errors, sentence improvement, active/passive voice, direct/indirect',
          order: 1,
          subtopics: [
            { name: 'Subject-Verb Agreement and Tenses', order: 1 },
            { name: 'Active and Passive Voice Transformation', order: 2 },
            { name: 'Direct and Indirect Speech', order: 3 },
          ],
        },
        {
          name: 'Vocabulary & Comprehension',
          description: 'Synonyms, antonyms, idioms, phrases, and cloze test',
          order: 2,
          subtopics: [
            { name: 'Idioms, Phrases and One-Word Substitutions', order: 1 },
            { name: 'Cloze Test and Reading Comprehension', order: 2 },
          ],
        },
      ],
    },
    {
      name: 'General Awareness',
      shortName: 'SSC-GA',
      description: 'History, polity, geography, general science, and current affairs',
      order: 4,
      weightage: 25,
      topics: [
        {
          name: 'Indian Polity & History',
          description: 'Constitutional articles, ancient, medieval, and modern Indian history',
          order: 1,
          subtopics: [
            { name: 'Important Constitutional Articles and Amendments', order: 1 },
            { name: 'Mughal Period, Delhi Sultanate & Modern Freedom Struggle', order: 2 },
          ],
        },
        {
          name: 'General Science & Current Affairs',
          description: 'Physics, chemistry, biology basics, and recent national & global events',
          order: 2,
          subtopics: [
            { name: 'Everyday Science Laws and Inventions', order: 1 },
            { name: 'Current Affairs, Awards, and Sports News', order: 2 },
          ],
        },
      ],
    },
  ],

  Banking: [
    {
      name: 'Quantitative Aptitude (Banking)',
      shortName: 'BANK-QA',
      description: 'Data interpretation, simplification, number series, and arithmetic problems',
      order: 1,
      weightage: 35,
      topics: [
        {
          name: 'Data Interpretation',
          description: 'Bar charts, tabular charts, radar graphs, caselets, and missing DI',
          order: 1,
          subtopics: [
            { name: 'Missing Value Tabular DI', order: 1 },
            { name: 'Caselet DI with Percentage/Ratio Logic', order: 2 },
            { name: 'Pie Charts and Line Graph DI', order: 3 },
          ],
        },
        {
          name: 'Speed Math & Arithmetic',
          description: 'Approximations, quadratic inequalities, wrong number series, arithmetic',
          order: 2,
          subtopics: [
            { name: 'Quadratic Equation Comparison (x > y)', order: 1 },
            { name: 'Missing & Wrong Number Series', order: 2 },
            { name: 'Profit-Loss, Compound Interest & Work Problems', order: 3 },
          ],
        },
      ],
    },
    {
      name: 'Reasoning Ability (Banking)',
      shortName: 'BANK-REAS',
      description: 'Complex floor/box puzzles, circular seating, input-output, and syllogisms',
      order: 2,
      weightage: 35,
      topics: [
        {
          name: 'Puzzles & Seating Arrangements',
          description: 'Floor puzzles, uncertain seating, parallel rows, and circular arrangements',
          order: 1,
          subtopics: [
            { name: 'Floor and Flat Based Puzzles', order: 1 },
            { name: 'Linear Arrangement (Uncertain Number of People)', order: 2 },
            { name: 'Circular & Square Seating (Inward/Outward Facing)', order: 3 },
          ],
        },
        {
          name: 'Logical Reasoning & Syllogisms',
          description: 'Only a few syllogisms, inequalities, machine input-output, coding',
          order: 2,
          subtopics: [
            { name: 'Syllogisms (Only / Only a Few / Possibility cases)', order: 1 },
            { name: 'Coded Inequalities and Directions', order: 2 },
            { name: 'Step-by-Step Machine Input-Output', order: 3 },
          ],
        },
      ],
    },
    {
      name: 'Banking & Financial Awareness',
      shortName: 'BANK-GA',
      description: 'RBI policies, banking operations, financial terms, and monetary updates',
      order: 3,
      weightage: 30,
      topics: [
        {
          name: 'RBI Functions & Monetary Policy',
          description: 'Repo rate, reverse repo, CRR, SLR, inflation indices, and PSL norms',
          order: 1,
          subtopics: [
            { name: 'Monetary Policy Instruments (Repo, Reverse Repo, MSF)', order: 1 },
            { name: 'Priority Sector Lending (PSL) Targets', order: 2 },
            { name: 'NPA Management, IBC & Basel III Norms', order: 3 },
          ],
        },
        {
          name: 'Banking Products & Technology',
          description: 'NEFT, RTGS, IMPS, UPI, CBDC, digital banking, and financial inclusions',
          order: 2,
          subtopics: [
            { name: 'Payment Systems (UPI, IMPS, RTGS, NACH)', order: 1 },
            { name: 'Financial Inclusion (PMJDY, Microfinance, Small Finance Banks)', order: 2 },
          ],
        },
      ],
    },
  ],

  GRE: [
    {
      name: 'Quantitative Reasoning',
      shortName: 'GRE-QUANT',
      description: 'Quantitative comparison, problem solving, and data interpretation',
      order: 1,
      weightage: 50,
      topics: [
        {
          name: 'Arithmetic & Algebra',
          description: 'Properties of integers, exponents, algebraic equations, and inequalities',
          order: 1,
          subtopics: [
            { name: 'Number Theory: Primes, Divisibility & Remainders', order: 1 },
            { name: 'Algebraic Expressions, Functions & Inequalities', order: 2 },
            { name: 'Quantitative Comparison Problem Types', order: 3 },
          ],
        },
        {
          name: 'Geometry & Data Analysis',
          description: 'Coordinate geometry, polygons, circles, probability, and statistics',
          order: 2,
          subtopics: [
            { name: 'Coordinate Geometry, Slopes & Intercepts', order: 1 },
            { name: 'Descriptive Statistics (Mean, Median, Standard Deviation)', order: 2 },
            { name: 'Permutations, Combinations & Probability Distributions', order: 3 },
          ],
        },
      ],
    },
    {
      name: 'Verbal Reasoning',
      shortName: 'GRE-VERBAL',
      description: 'Text completion, sentence equivalence, and reading comprehension',
      order: 2,
      weightage: 50,
      topics: [
        {
          name: 'Text Completion & Sentence Equivalence',
          description: 'Single, double, and triple blank completions; vocabulary in context',
          order: 1,
          subtopics: [
            { name: 'Single & Double Blank Text Completion', order: 1 },
            { name: 'Sentence Equivalence Pairs & Synonymous Context', order: 2 },
            { name: 'Advanced GRE Academic Vocabulary and Tone', order: 3 },
          ],
        },
        {
          name: 'Reading Comprehension',
          description: 'Dense passages from natural sciences, social sciences, and humanities',
          order: 2,
          subtopics: [
            { name: 'Primary Purpose and Main Idea Analysis', order: 1 },
            { name: 'Critical Reasoning: Strengthen, Weaken & Assumption', order: 2 },
          ],
        },
      ],
    },
  ],

  GMAT: [
    {
      name: 'Quantitative Reasoning',
      shortName: 'GMAT-QUANT',
      description: 'Problem solving questions focusing on logic, arithmetic, and algebra',
      order: 1,
      weightage: 34,
      topics: [
        {
          name: 'Problem Solving & Number Properties',
          description: 'Integers, fractions, decimals, ratios, percents, and algebraic equations',
          order: 1,
          subtopics: [
            { name: 'Number Properties & Advanced Remainder Theorems', order: 1 },
            { name: 'Rates, Work, and Mixture Applications', order: 2 },
            { name: 'Statistics: Variance, Standard Deviation & Sets', order: 3 },
          ],
        },
      ],
    },
    {
      name: 'Verbal Reasoning',
      shortName: 'GMAT-VERBAL',
      description: 'Reading comprehension and critical reasoning for executive decision making',
      order: 2,
      weightage: 33,
      topics: [
        {
          name: 'Critical Reasoning (CR)',
          description: 'Argument structure, assumptions, paradox resolution, boldface reasoning',
          order: 1,
          subtopics: [
            { name: 'Identifying Stated & Unstated Assumptions', order: 1 },
            { name: 'Strengthen / Weaken / Flaw in the Reasoning', order: 2 },
            { name: 'Boldface Argument Role Analysis', order: 3 },
          ],
        },
        {
          name: 'Reading Comprehension',
          description: 'Long and short business, economic, and scientific academic passages',
          order: 2,
          subtopics: [
            { name: 'Inference and Author Point of View', order: 1 },
            { name: 'Structure and Function of Specific Paragraphs', order: 2 },
          ],
        },
      ],
    },
    {
      name: 'Data Insights',
      shortName: 'GMAT-DI',
      description: 'Data sufficiency, multi-source reasoning, table analysis, graphics interpretation',
      order: 3,
      weightage: 33,
      topics: [
        {
          name: 'Data Sufficiency',
          description: 'Evaluating whether statements provide sufficient data to answer question',
          order: 1,
          subtopics: [
            { name: 'Value vs Yes/No Data Sufficiency Questions', order: 1 },
            { name: 'Inequalities and Absolute Values in Data Sufficiency', order: 2 },
          ],
        },
        {
          name: 'Integrated Data Insights',
          description: 'Multi-source tabbed documents, graphical data, and two-part analysis',
          order: 2,
          subtopics: [
            { name: 'Multi-Source Tabbed Reasoning', order: 1 },
            { name: 'Table Analysis and Two-Part Analysis Problems', order: 2 },
          ],
        },
      ],
    },
  ],
};

export const seedAllExamsSyllabus = async () => {
  await connectDB();

  console.log('--- Starting Comprehensive Multi-Exam Syllabus Seeding ---');

  for (const [examNameKey, subjects] of Object.entries(allSyllabusData)) {
    // Find exam by name regex
    let exam = await Exam.findOne({ name: new RegExp(`^${examNameKey}$`, 'i') });
    if (!exam) {
      exam = await Exam.findOne({ name: new RegExp(examNameKey, 'i') });
    }

    if (!exam) {
      console.log(`Creating missing exam: ${examNameKey}`);
      exam = await Exam.create({
        name: examNameKey,
        description: `National competitive examination for ${examNameKey}`,
        level: 'National',
      });
    }

    console.log(`\nProcessing Syllabus for [${exam.name}] (ID: ${exam._id})...`);

    // Clean up existing subjects & topics for this exam to ensure fresh, clean hierarchy
    const existingSubjects = await Subject.find({ examId: exam._id });
    const existingSubjectIds = existingSubjects.map(s => s._id);
    await Topic.deleteMany({ subjectId: { $in: existingSubjectIds } });
    await Subject.deleteMany({ examId: exam._id });

    let createdTopicCount = 0;

    for (const sub of subjects) {
      const { topics, ...subjectFields } = sub;
      const createdSubject = await Subject.create({
        ...subjectFields,
        examId: exam._id,
      });

      for (const top of topics) {
        await Topic.create({
          examId: exam._id,
          subjectId: createdSubject._id,
          name: top.name,
          description: top.description || '',
          order: top.order || 0,
          subtopics: top.subtopics || [],
        });
        createdTopicCount++;
      }
    }

    console.log(`✓ Seeded ${subjects.length} subjects & ${createdTopicCount} topics for [${exam.name}]`);
  }

  console.log('\n======================================================');
  console.log('✓ All 9 competitive exams now have complete syllabi!');
  console.log('======================================================');
};

if (process.argv[1]?.includes('seedAllSyllabus.js')) {
  seedAllExamsSyllabus()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}

