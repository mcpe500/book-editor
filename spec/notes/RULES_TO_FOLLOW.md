writing book rule:
**STRUCTURE RULES:**
1. Numeric headings (4.1, 4.2.1, etc.) — no A/B/C format
2. Follow kerangka-ver2.md structure exactly
3. Sections 4.3.2-4.3.4 must discuss dataset JSON before 4.4
**CONTENT RULES:**
4. All 10 cases must appear: DJ-01..04, QFT-01..02, VQE-01..02, QAOA-01..02
5. Classical-quantum must use same case_id
6. Each algorithm follows: problem → classical → tracing classical → quantum/hybrid → tracing quantum/hybrid → complexity
7. Time Complexity as PRIMARY metric
8. Classical pairs: DJ↔BruteForce, QFT↔FFT, VQE↔FCI, QAOA↔SimulatedAnnealing
9. Environment: Google Colab, CPU, 1024 shots
10. Must mention: qubits, shots, gate count, circuit depth, coupling map, SWAP when relevant
11. Dataset: JSON-only, canonical path scripts/datasets/
12. Convergence for VQE and QAOA must be explained
13. No QSVM/QPCA/Shor/Grover as main topics
**LANGUAGE RULES:**
14. Indonesian formal academic, natural, human, not stiff
15. No "saya/kamu/kita/pembaca"
16. No meta-comments ("sesuai proposal", "berikut penjelasannya")
17. No placeholders — FULL PROSE
18. No half-finished drafts
19. No chat style
**PARAGRAPH RULES:**
20. Core paragraphs: minimum 5 sentences
21. Pattern: topic sentence → core explanation → details/examples → implications → transition
22. No 1-3 sentence paragraphs without strong reason
**TECHNICAL CONCEPT RULES:**
23. New concept: definition → formal → symbol meaning → physical meaning → experiment relation
24. LaTeX for all formulas
25. After equation: explain symbols ("di mana...")
26. After symbols: explain meaning in context
**FIGURE/TABLE/ALGORITHM RULES:**
27. Figure: intro paragraph → figure + caption → interpretation paragraph
28. Table: intro paragraph → table → interpretation paragraph  
29. Pseudocode: intro → algorithm → interpretation → tracing table if needed
30. Never place element without context
**TERMINOLOGY (must be consistent):**
31. Quantum Computing (not "Komputasi Kuantum" mixing)
32. qubit, statevector, amplitudo kompleks, superposisi, entanglement, interferensi
33. gerbang kuantum, sirkuit kuantum, coupling map, circuit depth, ansatz, optimizer, oracle, Hamiltonian
**PRIORITY CONFLICT RESOLUTION:**
34. proposal.md > daftar isi > existing docs
35. JSON-only over CSV (user directive overrides revisiplan's old CSV mention)
36. kerangka-ver2 structure > daftar isi original structure (latest revision)