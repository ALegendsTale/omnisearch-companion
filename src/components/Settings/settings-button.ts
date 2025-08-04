import { html, css } from "lit";
import { customElement } from "lit/decorators.js"
import { SettingsField } from "./settings-field";

@customElement("settings-button")
export class SettingsButton extends SettingsField<'theme'> {
	static override styles = [
		...SettingsField.styles,
		css`
			#content {
				justify-content: center;
			}

			button {
				cursor: pointer;
				width: 32px;
				height: 32px;
				background-color: transparent;
				border: none;
				place-items: center;

				&:hover {
					border-radius: 314px;
				}
			}

			button:hover ::slotted(svg) {
				stroke: var(--highlight);
			}
		`
	];

	protected override _renderInterfaceContent() {
		return html`
			<button
				@click=${() => {
					this.dispatchEvent(this.updateValue);
				}}
			>
				<slot></slot>
			</button>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"settings-button": SettingsButton;
	}
}
