import { LitElement, html, css, nothing, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js"
import Storage, { SettingsType } from "../../utils/storage";
import { globalStyles } from "../../styles/styles";

@customElement("settings-field")
export class SettingsField<T extends keyof SettingsType> extends LitElement {
	static override styles = [
		globalStyles,
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
					margin-bottom: 1%;
				}
			}

			#content {
				position:  relative;
				display: flex;
				flex-basis: 88px;
				flex-shrink: 0;
				align-items: center;
			}

			svg {
				stroke: var(--text);
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
					<p class="name">
						${this.fieldName}
					</p>
					<p small class="description">
						${this.fieldDescription}
					</p>
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
		return this.storage.defaultSettings[fieldNameCamel];
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"settings-field": SettingsField<any>;
	}
}
