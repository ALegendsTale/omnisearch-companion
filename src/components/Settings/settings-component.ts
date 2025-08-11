import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import Storage, { SettingsType, Vault } from "../../utils/storage";
import _ from 'lodash'
import { createElement, Moon, Sun } from "lucide";

import '../header-component';
import './settings-button';
import './settings-dropdown';
import './settings-input';
import './settings-menu';
import { globalStyles } from '../../styles/styles';

type Display = "popup" | "embed";

@customElement('settings-component')
export class SettingsComponent extends LitElement {
	static override styles = [
		globalStyles,
		css`
			:host {
				display: flex;
				justify-content: center;
				align-items: center;
				z-index: 1;
				background-color: var(--background);
				width: 100%;
			}

			:host([display="popup"]) {
				display: none;
				position: absolute;
				top: 0;
				left: 0;
			}

			:host([display="embed"]) {
				display: flex;

				#wrapper {
					overflow-y: visible;
				}

				header-component {
					display: none;
				}

				h2 {
					display: none;
				}
			}

			#wrapper {
				display: flex;
				flex-direction: column;
				justify-content: flex-start;
				align-items: center;
				width: 100%;
				height: 100vh;

				h2 {
					color: var(--highlight);
					font-weight: bold;
					margin: 5%;
				}
			}

			#content {
				display: flex;
				flex-direction: column;
				background-color: var(--text-box);
				border-radius: 5px;
				padding: 5%;
				margin-bottom: 5%;
				flex-wrap: nowrap;
				color: var(--text);
				width: 80%;
				height: 100%;
				overflow-y: auto;
				scrollbar-width: thin;

				form {
					display: flex;
					flex-direction: column;
				}
			}
		`,
	];

	public storage: Storage = new Storage();

	@property({ type: String, reflect: true })
	display: Display = "popup";

	@state()
	settings: SettingsType = this.storage.defaultSettings;

	@state()
	vaults = this.storage.defaultVaults;

	override connectedCallback() {
		super.connectedCallback();

		this.loadSettings();
		this.loadVaults();
	}

	override render() {
		const sun = createElement(Sun);
		const moon = createElement(Moon);

		return html`
			<div id="wrapper">
				<header-component
					settings
					buttonTitle='Close settings and save'
					@buttonclicked=${() => this.toggleDisplay()}
				></header-component>
				<h2>Settings</h2>
				<div id="content">
					<form
						accept-charset="UTF-8"
					>
						<settings-menu
							id="vault"
							fieldName="Vault"
							fieldDescription="Select, add, or remove vault"
							.vaults=${this.vaults}
							@updatevault=${async (e: CustomEventInit<Vault[]>) => this.updateVaults(e.detail || this.vaults)}
						></settings-menu>
						<settings-input
							id="NotesShown"
							fieldName="Notes Shown"
							fieldDescription="The number of items displayed."
							value=${this.settings.notesShown.toString()}
							@updatevalue=${async (e: CustomEventInit<SettingsType['notesShown']>) => await this.updateSettings({ notesShown: e.detail || this.settings.notesShown })}
						></settings-input>
						<settings-input
							id="NotesScore"
							fieldName="Notes Score"
							fieldDescription="Filter results by relevance, from 0 (less relevant) to 100 (more relevant)."
							value=${this.settings.notesScore.toString()}
							@updatevalue=${async (e: CustomEventInit<SettingsType['notesScore']>) => await this.updateSettings({ notesScore: e.detail || this.settings.notesScore })}
						></settings-input>
						<settings-dropdown
							id="SearchType"
							fieldName="Search Type"
							fieldDescription="Query: Search notes based on URL query (?=). URL: Search notes based on full-text URL."
							value=${this.settings.searchType}
							@updatevalue=${async (e: CustomEventInit<SettingsType['searchType']>) => await this.updateSettings({ searchType: e.detail || this.settings.searchType })}
						></settings-dropdown>
						<settings-button
							id="Theme"
							fieldName="Theme"
							fieldDescription="Toggle between light and dark mode."
							value=${this.settings.theme}
							@updatevalue=${async (e: CustomEventInit<SettingsType['theme']>) => {
								if(e.detail === undefined) return;
								
								const newTheme: SettingsType['theme'] = e.detail === 'light' ? 'dark' : 'light';

								this.setTheme(newTheme);
								await this.updateSettings({ theme: newTheme });
							}}
						>
							${this.settings.theme === 'light' ? moon : sun}
						</settings-button>
					</form>
				</div>
			</div>
		`;
	}

	/**
	 * Toggle the display of the settings menu
	 */
	public toggleDisplay() {
		this.style.display = this.style.display === 'none' || this.style.display === '' ? 'flex' : 'none';
	}
	
	/**
	 * Toggle the theme style
	 */
	protected setTheme(newTheme: SettingsType['theme']) {
		document.documentElement.style.setProperty('color-scheme', newTheme);
	}

	protected async updateSettings(updatedSettings: Partial<SettingsType>) {
		const newSettings: SettingsType = {
			...this.settings,
			...updatedSettings
		};

		// Only update if settings have been changed
		if(!_.isEqual(this.settings, newSettings)){
			this.settings = newSettings;
		}

		await this.saveSettings();
	}

	/**
	 * Load settings from storage and restore values to `SettingsFields`
	 */
	protected async loadSettings() {
		this.settings = await this.storage.getSettings();

		this.migrateSettings();

		// Set loaded theme
		this.setTheme(this.settings.theme);
	}

	/**
	 * Save settings to storage
	 */
	protected async saveSettings() {
		await this.storage.setSettings(this.settings);
	}

	/**
	 * Migrate any old settings
	 */
	protected async migrateSettings() {
		// @ts-expect-error (searchType setting migration from Both to Auto)
		if(this.settings.searchType === 'Both') {
			this.settings = { ...this.settings, searchType: 'Auto' };
			await this.saveSettings();
		}
	}

	protected async updateVaults(updatedVaults: Vault[]) {
		// Only update if settings have been changed
		if(!_.isEqual(this.vaults, updatedVaults)) this.vaults = updatedVaults;

		await this.saveVaults();
	}

	/**
	 * Load settings from storage and restore values to `SettingsFields`
	 */
	protected async loadVaults() {
		this.vaults = await this.storage.getVaults();
	}

	/**
	 * Save settings to storage
	 */
	protected async saveVaults() {
		await this.storage.setVaults(this.vaults);
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'settings-component': SettingsComponent;
	}
}
