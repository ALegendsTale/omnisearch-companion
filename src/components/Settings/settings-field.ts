import { LitElement, html, css, nothing, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js"
import Storage, { SettingsType } from "../../utils/storage";

@customElement("settings-field")
export class SettingsField<T extends keyof SettingsType> extends LitElement {
	static override styles = [
	css`
			:host {
				margin-bottom: 20px;
			}

			#wrapper {
				display: flex;
				justify-content: space-between;
			}

			#setting {
				display: flex;
				flex-direction: column;
				margin-right: 5%;

				.name {
					font-size: 1rem;
					font-family: Inter;
					margin-bottom: 1%;
				}

				.description {
					font-size: .7rem;
					font-family: Inter;
				}
			}

			#content {
				position:  relative;
				display: flex;
				flex-direction: row;
				flex-basis: 88px;
				flex-shrink: 0;
				justify-content: center;
				align-items: center;

				button {
					display: flex;
					justify-content: center;
					align-items: center;

					svg {
						width: 90%;
						height: 90%;
						stroke: var(--text);
					}

					&:hover {
						background-color: var(--background);
					}

					&:hover > svg {
						stroke: var(--highlight);
					}
				}
			}
		`
	];

	storage: Storage = new Storage();

	@property({ type: String })
	fieldName: string = '';
	@property({ type: String })
	fieldDescription: string = '';
	@property({ type: String, reflect: true })
	value: string = '';
	
	// Accessor updates event detail value on each call
	public get updateValue() {
		return new CustomEvent('updatevalue', { detail: this.value });
	}

	override render() {
		return html`
			<div id="wrapper">
				<div id="setting">
					<span class="name">
						${this.fieldName}
					</span>
					<span class="description">
						${this.fieldDescription}
					</span>
				</div>
				<div id="content">
					${this._renderInterfaceContent()}
				</div>
			</div>
		`;
	}

	protected _renderInterfaceContent(): TemplateResult | typeof nothing {
		return nothing;
	}

	/**
	 * Confirms the reset with the user
	 */
	public resetAndConfirm() {
		if(confirm(`Reset ${this.fieldName} to ${this.getDefaultValue()}?`)) {
			this.resetValue();
		}
	}

	/**
	 * Reset to the default value
	 */
	public resetValue() {
		console.info(`Reset ${this.fieldName}`);
		// Set value to default
		this.value = this.getDefaultValue();
	}

	/**
	 * Checks if `fieldValue` is equal to the field's default value.
	 */
	public isDefaultValue(): boolean {
		return this.value === this.getDefaultValue();
	}

	/**
	 * Retrieves the default value of the current `SettingsField` from storage
	 */
	public getDefaultValue(): SettingsType[T] {
		const fieldNameCamel = this.fieldName.charAt(0).toLowerCase() + this.fieldName.slice(1).replace(' ', '') as T;
		return this.storage.defaultValues[fieldNameCamel];
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"settings-field": SettingsField<any>;
	}
}
