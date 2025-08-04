import { css } from "lit";

export const globalStyles = css`
	* {
		font-family: Inter;
	}

	h3,
	h4,
	h5,
	h6,
	p {
		margin: 0;
	}

	h1 {
		font-size: var(--step-2);
	}

	h2 {
		font-size: var(--step-1);
	}

	h3, p, input, u, a {
		font-size: var(--step-0);
	}

	p[small] {
		font-size: var(--step--2);
	}
`