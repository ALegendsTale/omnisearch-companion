import { html, css, TemplateResult, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, createElement } from "lucide";
import { SettingsField } from "./settings-field";
import { Vault } from "../../utils/storage";
import { choose } from "lit/directives/choose.js";

type MenuType = 
| 'select'
| 'add'
| 'success'

@customElement("settings-menu")
export class SettingsMenu extends SettingsField<'searchType'> {
	static override styles = [
		...SettingsField.styles,
		css`
			#dropdown {
				display: flex;
				width: 100%;

				button {
					display: flex;
					background-color: var(--off-white);
					color: var(--dark);
					border: var(--text) 2px solid;
					flex-basis: 88px;
					justify-content: space-between;
					align-items: center;
					padding-inline: .5rem;

					p, svg {
						color: var(--dark);
						stroke: var(--dark);
					}

					&:hover, &:hover p, &:hover svg {
						color: var(--purple);
						stroke: var(--purple);
					}
				}
			}

			#menu {
				display: none;
				flex-direction: column;
				gap: 10px;
				min-height: 120px;
				background-color: var(--background);
				margin-top: 5%;
				padding: 5%;
				border-radius: 5px;

				&[selection="select"] {
					justify-content: space-between;
					
					ul {
						display: flex;
						flex-direction: column;
						list-style: none;
						padding: 0;
						margin: 0;
						max-height: 150px;
						overflow-y: auto;
						gap: 10px;

						li {
							display: flex;
							justify-content: space-between;

							#vault-info {
								display: flex;
								flex-direction: column;
								justify-content: space-between;
								
								* {
									margin: 0;
								}
							}

							#vault-select {
								display: flex;
								gap: 10px;
							}
						}
					}
				}

				&[selection="add"] {
					form {
						display: flex;
						flex-direction: column;
						flex: 1;
						justify-content: space-between;
						gap: 10px;

						label {
							display: flex;
							justify-content: space-between;
							align-items: center;
						}
					}
				}

				&[selection="success"] {
					justify-content: space-between;

					& > h3 {
						color: var(--highlight);
						text-align: center;
					}
				}
			}

			input:not([type="submit"]) {
				color: var(--dark);
				background-color: var(--off-white);
				border: var(--text) 2px solid;

				&:hover {
					color: var(--purple);
				}
			}
			
			button, input[type="submit"] {
				background-color: transparent;
				border: none;
				padding: 0;

				&:hover, &:hover p, &:hover svg {
					color: var(--highlight);
					stroke: var(--highlight);
					background-color: transparent;
				}

				p, svg {
					color: var(--text);
					stroke: var(--text);
				}
			}

			.separate {
				display: flex;
				justify-content: space-between;
				align-items: center;
			}

			:host([open]) {
				#menu {
					display: flex;
				}
			}
		`
	];

	@query('input')
	input!: HTMLInputElement;

	@property({ type: Boolean, reflect: true })
	open: boolean = false;
	
	@property({ type: Array })
	vaults: Vault[] = this.storage.defaultVaults;

	@state()
	menuSelection: MenuType = 'select';

	@state()
	editingVault?: Vault;

	// Accessor updates event detail value on each call
	public get updateVault() {
		return new CustomEvent('updatevault', { detail: this.vaults });
	}

	override render() {
		const selectMenu = html`
			<ul>
				${this.vaults.map((vault) => {
					return html`
						<li>
							<div id="vault-info">
								<p>${vault.name}</p>
								<p small>Port: ${vault.port}</p>
							</div>
							<div id="vault-select">
								<input
									type="checkbox"
									?checked=${vault.active}
									@change=${(e: InputEvent) => {
										if(!(e.target instanceof HTMLInputElement)) return;
										this.setActive(vault, e.target.checked);
									}}
								>
								<button @click=${() => {
									this.editingVault = vault;
									this.menuSelection = 'add';
								}}>
									<u>Edit</u>
								</button>
								${
									this.vaults.length > 1 ?
									html`
										<button
											@click=${() => {
												if(confirm("Are you sure?")) this.removeVault(vault.name);
											}}
										>
											<u>Remove</u>
										</button>
									`
									: nothing
								}
							</div>
						</li>
					`
				})}
			</ul>
			<button
				class="separate"
				@click=${() => this.menuSelection = 'add'}
			>
				<p>Add Vault</p>
				${createElement(ChevronRight)}
			</button>
		`

		const returnHeader = (slotContent: TemplateResult) => {
			return html`
				<button
					class="separate"
					@click=${() => {
						this.editingVault = undefined;
						this.menuSelection = 'select';
					}}
				>
					${createElement(ChevronLeft)}
					${slotContent}
				</button>
			`
		}

		const addMenu = html`
			${returnHeader(html`<h3>Return</h3>`)}
			<form
				@submit=${(e: Event) => {
					if(!(e.target instanceof HTMLFormElement)) return;
					e.preventDefault();
					
					const data = new FormData(e.target);
					const name = data.get('name')?.toString();
					const port = data.get('port')?.toString();

					// Check if the port already exists in another vault
					if(this.vaults.some((vault) => vault.port.toString() === port && vault.name !== this.editingVault?.name)) {
						alert('This port is already in use.')
						return;
					}
					
					if(name && port) {
						// Remove old vault if editing
						if(this.editingVault) this.removeVault(this.editingVault.name);

						this.addVault({ name, port: +port, active: false });

						// Swap to success menu & reset editingVault
						this.editingVault = undefined;
						this.menuSelection = 'success';
					}
					else {
						alert('Please provide both a name and port');
					}
				}}
			>
				<label for="name">
					<p>Name</p>
					<input id="name" name="name" type="text" value=${this.editingVault?.name || ''}>
				</label>
				<label for="port">
					<p>Port</p>
					<input id="port" name="port" type="number" value=${this.editingVault?.port || ''} min=1>
				</label>
				<input
					id="add"
					type="submit"
					value=${this.editingVault ? 'Save' : 'Add'}
				>
			</form>
		`

		const successMenu = html`
			${returnHeader(html`<h3>Vault Settings</h3>`)}
			<h3>Success!</h3>
			<button @click=${() => this.menuSelection = 'add'}>
				<u>Add another</u>
			</button>
		`

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
			<div id="menu" selection=${this.menuSelection}>
				${
					choose(this.menuSelection, [
						['select', () => selectMenu],
						['add', () => addMenu],
						['success', () => successMenu]
					])
				}
			</div>
		`
	}

	protected override _renderInterfaceContent() {
		return html`
			<div id="dropdown">
				<button
					id="open"
					@click=${() => {
						// Toggle dropdownList display when clicked
						this.open = !this.open;
					}}
				>
					<p>Select</p>
					${this.open ? createElement(ChevronUp) : createElement(ChevronDown)}
				</button>
			</div>
		`;
	}

	/**
	 * @param name The name of the vault to add
	 * @param port The port associated with this vault
	 */
	public addVault(vault: Vault) {
		if(this.vaults.some((item) => item.name === vault.name)) return;

		this.vaults = [...this.vaults, vault];

		this.dispatchEvent(this.updateVault);
	}

	/**
	 * @param name The name of the vault to remove
	 */
	public removeVault(name: string) {
		this.vaults = this.vaults.filter((item) => item.name !== name);	

		this.dispatchEvent(this.updateVault);
	}

	/**
	 * Toggle or set vault to be active
	 * @param name 
	 * @param active Implicitly sets vault state
	 */
	public setActive(_vault: Vault, _active?: boolean) {
		this.vaults = this.vaults.map((vault) => vault.name === _vault.name ? { ...vault, active: _active ?? !vault.active } : vault);

		this.dispatchEvent(this.updateVault);
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"settings-menu": SettingsMenu;
	}
}