# ML and Systems Portfolio Rebalance

## Goal

Make the portfolio communicate one thesis within the first viewport: Adam likes solving hard problems, which has led him to machine learning and low-latency systems. Machine learning should be the first impression without obscuring the systems work.

## Homepage

- Replace the current systems-heavy positioning with the hard-problems thesis.
- Keep the first viewport focused on Adam's name, degree, thesis, and profile links.
- Do not show standalone metrics in the hero. Keep every number attached to the project or experience entry that explains it.
- Order projects ML/research first, systems second.
- Keep Lightshift and Verazoi in Experience, where their accomplishments belong.
- Give Lightshift and Verazoi direct metrics rather than separate case-study pages. Lightshift can be the longest experience entry because it includes model search, forecasting results, learned encoders, production-faithful scoring, and training-path performance work.

## Featured Work

Keep four projects:

1. Physics-Informed Neural Networks for Financial PDEs
2. Portfolio Research Toolkit
3. C++ Event Processing and Matching Engine
4. Vectorized Columnar Analytics Engine

The PINN project replaces the generic Applied ML Case Study. The Portfolio Research Toolkit remains.

## Project Pages

Each page should read like a compact technical README:

1. Why
2. Tech stack
3. Key metrics
4. What I built
5. How it works
6. Evaluation
7. Limitations
8. Links and reproducibility

Descriptions should be one sentence where possible. Lists should usually contain two or three bullets. Metrics should appear near the top, not after several methodology sections.
Use literal interface language such as "View project." Remove phrases such as "Review the evidence" and other self-conscious portfolio framing.

## Content Boundaries

- Use only accomplishments and metrics already present in Adam's resumes.
- Describe Lightshift and Verazoi directly as experience.
- Do not present employer work as a standalone public case study.
- Do not reveal confidential data sources, customer identities, regional identities, raw records, or private code.
- Keep limitations explicit and short.

## Implementation

- Extend the project data with an explicit tech stack and headline metric list.
- Replace the applied-ML project record with the PINN project record.
- Simplify the shared project-page template rather than building special pages.
- Add reusable metric treatments to project cards and project pages.
- Update static verification to enforce the new thesis, project set, README headings, and absence of case-study language.
- Preserve the restrained static visual design and existing responsive behavior.

## Success Criteria

- The first viewport explicitly connects hard problems, machine learning, and low-latency systems.
- ML evidence appears before systems evidence.
- Metrics appear with the relevant project or experience entry, never as a context-free hero strip.
- Lightshift and Verazoi show direct accomplishments with measurable results.
- No page is titled or framed as an applied ML case study.
- Each project page is materially shorter and uses the common README structure.
- The static build and portfolio verification pass.
