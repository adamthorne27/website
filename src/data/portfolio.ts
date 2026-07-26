export type EvidenceLink = {
	label: string;
	href: string;
	kind: 'repository' | 'source' | 'documentation' | 'benchmark';
};

export type HeadlineMetric = {
	value: string;
	label: string;
};

export type MetricTable = {
	caption: string;
	columns: string[];
	rows: string[][];
};

export type MetricComparison = {
	title: string;
	items: {
		label: string;
		value: number;
		display: string;
	}[];
};

export type Project = {
	slug: string;
	title: string;
	category: string;
	summary: string;
	stack: string[];
	metrics: HeadlineMetric[];
	why: string;
	contribution: string[];
	architecture: string[];
	evaluation: string[];
	results: MetricTable[];
	comparisons?: MetricComparison[];
	limitations: string[];
	reproducibility: string[];
	links: EvidenceLink[];
};

export type Experience = {
	organization: string;
	role: string;
	period: string;
	highlights: string[];
};

export const profileLinks = [
	{
		label: 'Resume',
		href: '/Adam_Thorne_Resume.pdf',
	},
	{
		label: 'GitHub',
		href: 'https://github.com/adamthorne27',
	},
	{
		label: 'LinkedIn',
		href: 'https://www.linkedin.com/in/adam-thorne-55b931261/',
	},
	{
		label: 'Email',
		href: 'mailto:at@adamthorne.com',
	},
];

export const projects: Project[] = [
	{
		slug: 'physics-informed-neural-networks',
		title: 'Physics-Informed Neural Networks for Financial PDEs',
		category: 'Machine learning · Scientific computing',
		summary: 'Inverse-PDE experiments for recovering local-volatility surfaces under controlled noise.',
		stack: ['Python', 'PyTorch', 'PINNs', 'Neural ODEs', 'Autograd'],
		metrics: [
			{ value: '2–3 orders', label: 'lower surface MSE' },
			{ value: '3', label: 'noise levels tested' },
		],
		why:
			'Local-volatility calibration is an inverse problem: infer a stable volatility surface from noisy observations while respecting the governing financial PDE.',
		contribution: [
			'Implemented inverse PINN and neural-adjoint solvers for Black-Scholes and Dupire constraints.',
			'Built controlled experiments at 0%, 1%, and 5% noise with fixed evaluation grids.',
			'Compared surface error, smoothness, training time, and stability against simpler baselines.',
		],
		architecture: [
			'Noisy option observations',
			'Neural volatility surface',
			'Autograd PDE residuals',
			'Boundary and data losses',
			'Recovered surface',
			'Baseline comparison',
		],
		evaluation: [
			'Use the same observations, grid, noise seed, and error calculation for every solver.',
			'Report surface MSE with training time and failure behavior instead of treating fit alone as success.',
		],
		results: [
			{
				caption: 'Inverse-PDE experiment summary',
				columns: ['Measure', 'Result', 'Boundary'],
				rows: [
					['Surface MSE', '2–3 orders lower', 'Across controlled 0%, 1%, and 5% noise settings'],
					['Recovered surface', 'Smoother than simpler baselines', 'Evaluated on a fixed grid'],
					['Compute cost', 'Higher training time', 'Accuracy and stability came with a clear cost'],
				],
			},
		],
		limitations: [
			'Results come from controlled synthetic-noise experiments, not live market calibration.',
			'PINN training is slower and sensitive to loss weighting and optimization.',
			'The public repository and full experiment artifact are not yet linked.',
		],
		reproducibility: [
			'Freeze the observation grid, noise seeds, solver settings, and evaluation grid before comparison.',
			'Publish surface-error tables, training curves, runtime, and failed runs with the source.',
		],
		links: [
			{
				label: 'Paper (PDF)',
				href: '/Adam_Thorne_PINN_Paper.pdf',
				kind: 'documentation',
			},
		],
	},
	{
		slug: 'portfolio-research-toolkit',
		title: 'Portfolio Research Toolkit',
		category: 'Machine learning · Quantitative research',
		summary: 'Shared data, validation, portfolio, and experiment contracts for comparing model-driven strategies.',
		stack: ['Python', 'Polars', 'Parquet', 'cvxpy', 'QuantStats', 'MLflow'],
		metrics: [
			{ value: '4', label: 'portfolio builders' },
			{ value: '3', label: 'chronological split stages' },
		],
		why:
			'Model results are hard to compare when data windows, targets, portfolio rules, costs, and reports change between experiments.',
		contribution: [
			'Built validated OHLCV loading, Parquet caching, feature and target helpers, and chronological splits.',
			'Implemented equal-weight, rank, top-k, and risk-adjusted portfolio construction.',
			'Added cost-aware backtests, benchmark reports, QuantStats artifacts, and MLflow tracking.',
		],
		architecture: [
			'Dataset preset',
			'Validated market data',
			'Features and targets',
			'Model predictions',
			'Portfolio weights',
			'Backtest and MLflow',
		],
		evaluation: [
			'Validate dates, tickers, horizons, weights, and transaction-cost assumptions before running a strategy.',
			'Compare models on fixed chronological windows against SPY and equal-weight baselines.',
		],
		results: [
			{
				caption: 'Implemented research path',
				columns: ['Stage', 'Current implementation', 'Current boundary'],
				rows: [
					['Data', 'Validated OHLCV and Parquet cache', 'No point-in-time fundamentals'],
					['Models', 'Shared prediction and weight contracts', 'Training remains notebook-owned'],
					['Portfolio', 'Four construction methods with costs', 'Long-only v1'],
					['Reporting', 'Benchmarks, QuantStats, and MLflow', 'No factor-risk attribution'],
				],
			},
		],
		limitations: [
			'The current data path does not guarantee point-in-time constituents or delisting-complete coverage.',
			'Fixed chronological splits are implemented; a rolling walk-forward runner is not.',
			'No strategy return is published without a frozen, reproducible comparison report.',
		],
		reproducibility: [
			'Install the repository, select a TOML dataset preset, and run the documented workflow.',
			'Publish the preset, dates, seed, model settings, costs, predictions, weights, and generated reports together.',
		],
		links: [
			{
				label: 'Repository',
				href: 'https://github.com/adamthorne27/Portfolio-Optimization-Lib',
				kind: 'repository',
			},
			{
				label: 'End-to-end workflow',
				href: 'https://github.com/adamthorne27/Portfolio-Optimization-Lib/blob/main/docs/end_to_end_workflow.md',
				kind: 'documentation',
			},
			{
				label: 'Backtest implementation',
				href: 'https://github.com/adamthorne27/Portfolio-Optimization-Lib/blob/main/src/portfolio_toolkit/backtest.py',
				kind: 'source',
			},
			{
				label: 'Portfolio construction',
				href: 'https://github.com/adamthorne27/Portfolio-Optimization-Lib/blob/main/src/portfolio_toolkit/portfolio.py',
				kind: 'source',
			},
		],
	},
	{
		slug: 'event-processing-matching-engine',
		title: 'C++ Event Processing and Matching Engine',
		category: 'C++20 · Low-latency systems',
		summary: 'A deterministic event engine for measuring queue design, throughput, and tail latency.',
		stack: ['C++20', 'CMake', 'CTest', 'SPSC/MPSC queues', 'Sanitizers'],
		metrics: [
			{ value: '4.2M', label: 'messages per second' },
			{ value: '<35 μs', label: 'p99 latency' },
		],
		why:
			'Small allocations, synchronization, and backpressure can dominate latency-sensitive producer-consumer systems.',
		contribution: [
			'Implemented preallocated event storage and SPSC/MPSC producer-consumer paths.',
			'Built seeded workload generation, deterministic replay, and invariant checks.',
			'Separated warmup, throughput, and percentile-latency reporting.',
		],
		architecture: [
			'Seeded events',
			'SPSC or MPSC producers',
			'Ring buffer',
			'Stateful consumer',
			'Replay checks',
			'Latency report',
		],
		evaluation: [
			'Replay identical seeded workloads across ring-buffer and mutex-backed queue variants.',
			'Report throughput and latency percentiles after warmup; run CTest and supported sanitizers.',
		],
		results: [
			{
				caption: 'Current local benchmark',
				columns: ['Measure', 'Result', 'Boundary'],
				rows: [
					['Throughput', '4.2M messages/second', 'Single-machine local run'],
					['Tail latency', 'p99 below 35 microseconds', 'Not a network or exchange guarantee'],
					['Correctness', 'Replay, invariants, and sanitizer runs', 'Public test source pending'],
				],
			},
		],
		limitations: [
			'The measurements are local single-machine results.',
			'The public source and benchmark artifact are not yet available.',
			'The price-time-priority order book remains a design boundary, not a published implementation.',
		],
		reproducibility: [
			'Publish compiler and host metadata, queue capacity, producer count, payload shape, seed, and raw percentiles.',
			'Require clean Release and sanitizer builds before treating the benchmark as reproducible.',
		],
		links: [],
	},
	{
		slug: 'vectorized-columnar-analytics',
		title: 'Vectorized Columnar Analytics Engine',
		category: 'C++20 · Query execution',
		summary: 'A typed columnar engine for scan, filter, projection, and hash aggregation.',
		stack: ['C++20', 'CMake', 'CTest', 'DuckDB', 'Python benchmarks'],
		metrics: [
			{ value: '39.3×', label: 'scan p50 speedup' },
			{ value: '5.24×', label: 'group-by p50 speedup' },
		],
		why:
			'Analytical queries should process the needed columns in batches instead of paying per-row object and dispatch costs.',
		contribution: [
			'Built typed nullable columns and scan, filter, project, and hash-aggregate operators.',
			'Implemented an independent row engine and fixed DuckDB queries for correctness checks.',
			'Created seeded data generation and benchmark reports with latency percentiles and binary hashes.',
		],
		architecture: [
			'Schema-defined CSV',
			'Columnar table',
			'Scan',
			'Filter and project',
			'Hash aggregate',
			'Result checksum',
		],
		evaluation: [
			'Use seed 42, 3 warmups, and 20 measured Release iterations with batch size 4096.',
			'Check output row counts and checksums against the independent row engine and DuckDB.',
		],
		results: [
			{
				caption: 'Representative checked-in local benchmark',
				columns: ['Workload', 'Columnar p50', 'Row p50', 'Speedup'],
				rows: [
					['Scan · 1M rows', '2.04 ms', '80.01 ms', '39.30×'],
					['Filter · 1M rows', '76.42 ms', '274.10 ms', '3.59×'],
					['Group by · 1M rows', '134.03 ms', '702.65 ms', '5.24×'],
					['Filter + group by', '77.01 ms', '216.69 ms', '2.81×'],
				],
			},
		],
		comparisons: [
			{
				title: 'Scan p50 latency · lower is better',
				items: [
					{ label: 'Columnar', value: 2.036, display: '2.04 ms' },
					{ label: 'Row baseline', value: 80.014, display: '80.01 ms' },
				],
			},
			{
				title: 'Group-by p50 latency · lower is better',
				items: [
					{ label: 'Columnar', value: 134.028, display: '134.03 ms' },
					{ label: 'Row baseline', value: 702.646, display: '702.65 ms' },
				],
			},
		],
		limitations: [
			'Results are local AppleClang 17 measurements on arm64 macOS.',
			'There is no SQL parser, optimizer, join engine, persistence, SIMD path, or multithreaded execution.',
			'The public repository exists, but source publication is still pending.',
		],
		reproducibility: [
			'Build in Release mode, regenerate seed-42 data, and run 3 warmups plus 20 measured iterations.',
			'Compare the fixed reference queries against DuckDB and record compiler, host, and binary hash.',
		],
		links: [
			{
				label: 'Repository — source publication pending',
				href: 'https://github.com/adamthorne27/Columnar-Query-Eng',
				kind: 'repository',
			},
		],
	},
];

export const experience: Experience[] = [
	{
		organization: 'Lightshift Energy',
		role: 'Machine Learning Analyst Intern',
		period: 'Summer 2026',
		highlights: [
			'Automated model training, HPO, scoring, and comparison across roughly 1,800 configurations and 620 HPO trials over about 800 GPU-hours.',
			'Reached 1.88% MPE, 63.4% capture@1, and 100% capture@4 across 155,952 forecasts with roughly 4× lower MAE than a baseline.',
			'Raised capture@1 by 9.2 percentage points versus production while holding MAE within 0.02 MW.',
			'Benchmarked spatial autoencoder weather representations against legacy and competitor encoders, reaching 100% capture@3/@4 and improving capture@3 by 3.03 percentage points.',
			'Reduced model-selection risk with production-faithful scoring harnesses, reproducing deployed metrics within noise and resolving peak-set and capture-metric discrepancies.',
			'Profiled the training data path to reduce epoch time from 30.3 seconds to 8.6 seconds and a projected 12+ hour pipeline stall to 15–20 minutes.',
		],
	},
	{
		organization: 'Verazoi',
		role: 'Founding Machine Learning Engineer and Researcher',
		period: 'February 2026 — present',
		highlights: [
			'Built multimodal event-forecasting pipelines across 44,348 windows and 177,392 horizon targets.',
			'Reached 0.853 mean test AUPRC and 79.1% F1 at 60 minutes.',
			'Used time-aware splits, horizon-specific labels, threshold policies, and tracked evaluations.',
		],
	},
	{
		organization: 'Machine Learning Student Network',
		role: 'Project Manager and Machine Learning Engineer',
		period: 'October 2025 — present',
		highlights: [
			'Built shared data, prediction, portfolio, backtest, reporting, and MLflow contracts for a quantitative research team.',
			'Helped researchers debug leakage, metric choice, baseline design, and portfolio-level interpretation.',
		],
	},
];
