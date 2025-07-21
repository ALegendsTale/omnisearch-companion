import { html, css } from "lit";
import { customElement } from "lit/decorators.js"
import { SettingsField } from "./settings-field";

@customElement("settings-button")
export class SettingsButton extends SettingsField<'theme'> {
	static override styles = [
		...SettingsField.styles,
		css`
			button {
				cursor: pointer;
				width: 32px;
				height: 32px;
				background-color: transparent;
				border: none;

				&:hover {
					border-radius: 314px;
				}
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
