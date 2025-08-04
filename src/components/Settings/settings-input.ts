import { html, css } from "lit";
import { customElement, query } from "lit/decorators.js"
import { styleMap } from "lit/directives/style-map.js"
import { SettingsField } from "./settings-field";
import { createElement, Undo2 } from "lucide";

@customElement("settings-input")
export class SettingsInput extends SettingsField<'notesScore' | 'notesShown'> {
	static override styles = [
		...SettingsField.styles,
		css`
			input {
				width: 88px;
				height: 24px;
				padding-left: 10px;
				box-sizing: border-box;
				color: var(--dark);
				background-color: var(--off-white);
				border: var(--text) 2px solid;

				&:hover {
					color: var(--purple);
				}
			}

			button {
				cursor: pointer;
				position: absolute;
				right: 0;
				height: 24px;
				border: none;
				box-sizing: border-box;

				&:hover {
					background-color: var(--light-purple);
				}

				svg {
					stroke: var(--dark-2);
				}

				&:hover > svg {
					stroke: var(--dark-2);
				}
			}
		`
	];

	@query('input')
	input!: HTMLInputElement;
	@query('button')
	button!: HTMLButtonElement;

	protected override _renderInterfaceContent() {
		// Sanitizes field name by replacing spaces with dashes
		const fieldNameSanitized = this.fieldName.replace(' ', '-').toLowerCase();

		const styles = {
			visibility: this.isDefaultValue() ? 'hidden' : 'visible',
		}

		return html`
			<input
				id=${fieldNameSanitized}
				type="text"
				name=${fieldNameSanitized + '-input'}
				value=${this.value}
				@input=${(e: InputEvent) => {
					if(!(e.target instanceof HTMLInputElement)) return;
					this.value = e.target.value;
				}}
				@change=${() => {
					// Save value
					this.dispatchEvent(this.updateValue);
				}}
			>
			<button
				style=${styleMap(styles)}
				title=${this.isDefaultValue() ? '' : `Reset to ${this.getDefaultValue()}`}
				@click=${(e: MouseEvent) => this.resetAndConfirm()}
			>
				${createElement(Undo2)}
			</button>
		`;
	}
	
	override resetValue(): void {
		super.resetValue();

		// Update input (hide reset button)
		this.input.value = this.value;
		// Save value
		this.dispatchEvent(this.updateValue);
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"settings-input": SettingsInput;
	}
}
