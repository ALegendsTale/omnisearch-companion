import { LitElement, html, css } from "lit";
import { customElement, property, query } from "lit/decorators.js"
import { createElement, Settings as SettingsIcon, Save as SaveIcon } from "lucide";

@customElement("header-component")
export class HeaderComponent extends LitElement {
	static override styles = [
		css`
			:host {
				width: 100%;
			}
			
			div {
				display: flex;
				justify-content: center;
				align-items: center;
				background-color: var(--purple);
				width: 100%;
				height: 60px;
				gap: 5%;
				box-sizing: border-box;
			}

			h1 {
				font-family: Inter;
				font-weight: bold;
				font-size: 1.5rem;
				color: var(--off-white);
				white-space: nowrap;
			}

			button {
				background-color: transparent;
				border: none;
				cursor: pointer;

				&:hover > svg {
					stroke: var(--grey);
				}
			}

			svg {
				background-color: transparent;
				stroke: white;
				width: 1.5rem;
				height: 1.5rem;
			}
		`
	];

	@property({ type: Boolean, reflect: true })
	settings: boolean = false;

	@property({ type: String, reflect: true })
	buttonTitle: string = '';

	@query('button')
	button!: HTMLButtonElement;

	override render() {
		return html`
			<div>
				<h1>OMNISEARCH COMPANION</h1>
				<button
					title=${this.buttonTitle}
					@click=${(e: MouseEvent) => {
						e.preventDefault();
						const clickEvent = new CustomEvent('buttonclicked');
						this.dispatchEvent(clickEvent);
					}}
				>
					${createElement(this.settings ? SaveIcon : SettingsIcon)}
				</button>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"header-component": HeaderComponent;
	}
}
