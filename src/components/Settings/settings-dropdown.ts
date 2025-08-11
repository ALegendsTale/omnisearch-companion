import { html, css } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { SettingsField } from "./settings-field";
import { createElement, Undo2 } from "lucide";
import { SearchType } from "../../utils/storage";

@customElement("settings-dropdown")
export class SettingsDropdown extends SettingsField<'searchType'> {
	static override styles = [
		...SettingsField.styles,
		css`
			#dropdown {
				display: flex;
				position: relative;
				width: 88px;
				height: 24px;
				box-sizing: border-box;
				color: var(--dark);
				background-color: var(--off-white);

				input {
					display: flex;
					flex: 1;
					align-items: center;
					cursor: pointer;
					user-select: none;
					border: none;
					background: none;
					padding: 0 0 0 10px;
					text-align: left;
					color: var(--dark);
					border: var(--text) 2px solid;

					&:hover {
						color: var(--purple);
					}
				}

				ul {
					width: 70px;
					position: absolute;
					display: none;
					flex-direction: column;
					gap: 5px;
					list-style: none;
					top: 22px;
					left: -2px;
					padding: 5px 9px;
					margin: 0;
					z-index: 1;
					background-color: var(--grey);

					li {
						color: var(--dark);
						cursor: pointer;
						user-select: none;
						padding: 5%;

						&:hover {
							color: var(--purple);
						}
					}
				}
			}

			button {
				cursor: pointer;
				position: absolute;
				top: -2px;
				right: -2px;
				height: 24px;
				border: none;
				box-sizing: border-box;

				&:hover {
					background-color: var(--light-purple);
				}

				svg {
					stroke: var(--dark-2);

					&:hover {
						stroke: var(--dark-2);
					}
				}
			}

			:host([open]) #dropdown ul {
				display: flex;
			}

			:host(:not([open])) #dropdown ul {
				display: none;
			}
		`
	];

	@query('input')
	input!: HTMLInputElement;

	@property({ type: Boolean, reflect: true })
	open: boolean = false;

	protected override _renderInterfaceContent() {
		const options: SearchType[] = [
			'Auto',
			'Query',
			'Full URL',
			'Partial URL',
			'Title'
		]

		const styles = {
			visibility: this.isDefaultValue() ? 'hidden' : 'visible',
		}

		return html`
			<div id="dropdown">
				<input
					type="button"
					value=${this.value}
					@click=${(e: MouseEvent) => {
						// Toggle dropdownList display when clicked
						this.open = !this.open;
					}}
					@blur=${() => this.open = false}
				>
				<ul>
					${options.map((val) => {
						return html`
							<li
								@mousedown=${() => {
									// Set value to selected option
									this.value = val;
									// Save value
									this.dispatchEvent(this.updateValue);
									// Hide list
									this.open = false;
								}}
							>
								<p>
									${val}
								</p>
							</li>
						`
					})}
				</ul>
				<button
					style=${styleMap(styles)}
					title=${this.isDefaultValue() ? '' : `Reset to ${this.getDefaultValue()}`}
					@click=${(e: MouseEvent) => this.resetAndConfirm()}
				>
					${createElement(Undo2)}
				</button>
			</div>
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
		"settings-dropdown": SettingsDropdown;
	}
}
