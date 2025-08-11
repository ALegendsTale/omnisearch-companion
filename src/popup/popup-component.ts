import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import browser from 'webextension-polyfill';
import Showdown from "showdown";
import { ChevronDown, ChevronUp, createElement, Settings as SettingsIcon } from "lucide";
import sanitize from "sanitize-html";
import { getShortString, getShortURL } from '../utils/helpers';
import { ResultNoteApi } from '../types/OmnisearchTypes';
import { SettingsComponent } from '../components/Settings/settings-component';

import Storage, { Vault } from '../utils/storage';

import '../components/header-component';
import '../components/Settings/settings-component';
import '../components/note-item';
import _ from 'lodash';
import { globalStyles } from '../styles/styles';
import { asyncAppend } from 'lit/directives/async-append.js';
import { classMap } from 'lit/directives/class-map.js';

type Message = { query: string, rawNotes: ResultNoteApi[], notes: ResultNoteApi[], errors: Vault[] };

@customElement('popup-component')
export class PopupComponent extends LitElement {
	static override styles = [
		globalStyles,
		css`
			:host {
				display: flex;
				flex-direction: column;
				justify-content: flex-start;
				align-items: center;
				width: 100%;
				height: 100vh;
				max-width: 400px;
			}

			#preview {
				display: flex;
				flex-direction: column;
				max-width: 400px;
				width: 100%;
				background-color: var(--background);
				z-index: 1;

				button {
					color: var(--text);
					background: var(--text-box);
					border: none;

					&:hover {
						color: var(--highlight);
					}
				}

				div {
					margin: 5%;
					color: var(--text);
					overflow-y: auto;
					scrollbar-width: thin;
					flex-basis: 150px;
					flex-shrink: 0;
					flex-grow: 0;
					box-sizing: border-box;

					a {
						text-decoration: none;
						color: var(--text);

						&:hover {
							color: var(--highlight);
						}
					}
				}
			}

			#info {
				display: flex;
				justify-content: space-between;
				width: 100%;
				padding: 20px;
				box-sizing: border-box;

				h2 {
					color: var(--highlight);
					font-weight: bold;
					margin: 0;
					padding: 0;
				}

				h3 {
					font-weight: 400;
					margin: 0;
					padding: 0;
					text-wrap: nowrap;
				}

				#query, #vaults {
					display: flex;
					flex-direction: column;
					gap: 5px;
				}

				#query {
					div {
						display: flex;
					}

					img {
						display: none;
						width: 20px;
						height: 20px;
						border-radius: 314px;
					}
				}

				#vaults {
					* {
						text-align: right;
					}

					h3 {
						display: flex;
						justify-content: flex-end;
						gap: 5px;
					}
					
					.error {
						color: red;
					}
				}
			}

			#content {
				display: flex;
				flex-direction: column;
				background-color: var(--text-box);
				border-radius: 5px;
				margin: 0 5% 5% 5%;
				padding: 5% 5% 5% 10%;
				flex-wrap: nowrap;
				color: var(--text);
				width: 75%;
				height: 100%;
				overflow-y: auto;
				scrollbar-width: thin;

				p {
					display: flex;
					align-self: center;
					color: var(--text);
					text-align: center;
					max-width: 400px;
				}
			}
			
			.settings {
				display: flex;
				flex-direction: column;
				place-items: center;
				gap: 5px;
				margin-block: 5px;

				button {
					width: fit-content;
					background-color: transparent;
					border: none;
					cursor: pointer;

					svg {
						background-color: transparent;
						stroke: var(--highlight);
						width: var(--step-1);
						height: var(--step-1);
					}
				}
			}
		`,
	];

	public storage: Storage = new Storage();

	@property({ type: String, reflect: true })
	query: string = '';
	@property({ type: Array })
	rawNotes: ResultNoteApi[] = [];
	@property({ type: Array })
	notes: ResultNoteApi[] = [];
	@property({ type: Array })
	errors: Vault[] = [];

	@query('settings-component')
	settings!: SettingsComponent;

	@state()
	previewOpen: boolean = false;

	@state()
	previewContent: string = '';

	// Create new markdown > HTML converter object
	showdown = new Showdown.Converter();

	popupPort: browser.Runtime.Port | null = null;
	
	override connectedCallback(): void {
		super.connectedCallback();

		// Create & connect port to bgScript
		this.popupPort = browser.runtime.connect({ name: 'popup' });
		this.popupPort.onMessage.addListener(this.receiveMessage.bind(this));

		this.showdown.setFlavor('github');
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();

		if(this.popupPort) {
			if(this.popupPort.onMessage.hasListener(this.receiveMessage)) this.popupPort.onMessage.removeListener(this.receiveMessage);
			this.popupPort.disconnect();
		}
	}

	/**
	 * Create notes from received message
	 */
	async receiveMessage(msg: Message) {
		this.query = msg.query;
		this.rawNotes = msg.rawNotes;
		this.notes = msg.notes;
		this.errors = msg.errors;
	}

	override render() {
		const chevronDown = createElement(ChevronDown);
		const chevronUp = createElement(ChevronUp);

		// Checks if query is a URL
		const isQueryURL = URL.canParse(this.query);
		// Checks if URL has a pathname
		const urlHasPath = isQueryURL && new URL(this.query).pathname !== '/';

		const favicon = isQueryURL ? `https://www.google.com/s2/favicons?domain=${new URL(this.query).href}&sz=${32}` : '';

		const previewStyles = {
			display: this.previewOpen ? 'flex' : 'none',
		}

		const faviconStyles = {
			display: urlHasPath ? 'unset' : 'none',
		}
		
		const omnisearchContent = () => {
			if(!this.notes) {
				return html`
					<p>Failed to connect to Omnisearch.</p>
					<p>Please ensure Obsidian is open, the Omnisearch HTTP server is enabled, and that the port in settings matches.</p>
				`;
			}
			else if(this.notes.length < 1) {
				const plural = this.rawNotes.length > 1;

				return html`
					<p>No notes match this query.</p>
					${
						this.rawNotes.length > 0 ?
						html`
							<div class="settings">
								<p small>There ${plural ? 'are' : 'is'} ${this.rawNotes.length} hidden ${plural ? 'notes' : 'note'}. The score setting can be adjusted to view ${plural ? 'them' : 'it'}.</p>
								<button class="settings" @click=${() => this.settings.toggleDisplay()}>${createElement(SettingsIcon)}</button>
							</div>							
						`
						: nothing
					}
					
				`;
			}
			else {
				return this.notes.map((note) => {
					return html`
						<note-item
							title=${
								`Vault:\n${note.vault}\n\nMatching Words:\n${note.foundWords.join('\n')}`
							}
							@clicknote=${() => {
								// Open deep-link directly without creating tab / window
								browser.tabs.update({ url: `obsidian://open?vault=${note.vault}&file=${note.path}` });
								// Close popup window
								window.close();
							}}
							@mouseover=${() => {
								// Load preview window content on hover
								this.previewContent = sanitize(this.showdown.makeHtml(note.excerpt));
							}}
						>
							${note.basename}
						</note-item>
					`;
				})
			}
		}

		return html`
			<header-component @buttonclicked=${() => this.settings.toggleDisplay()}></header-component>
			<div id="info">
				<div id="query" title=${this.query}>
					<h2>Search Query</h2>
					<div>
						<img
							src=${urlHasPath ? favicon : ''}
							style=${styleMap(faviconStyles)}
						>
						<h3>
							${isQueryURL ? getShortURL(new URL(this.query), urlHasPath) : this.query ? getShortString(this.query) : nothing}
						</h3>
					</div>
				</div>
				<div id="vaults">
					<h2>Active Vaults</h2>
					<h3>
						${asyncAppend(this.getVaultsIterable(), (_vault) => {
							const vault = _vault as Vault & { error: boolean };
							return vault === null ? nothing : html`<span class=${classMap({ error: vault.error })} title=${vault.error ? 'Vault could not connect.' : `port: ${vault.port}`}>${vault.name}</span>`
						})}
					</h3>
				</div>
			</div>
			<ol id="content">
				${omnisearchContent()}
			</ol>
			<div id="preview">
				<button
					title=${`${this.previewOpen ? 'Close' : 'Open'} preview window`}
					@click=${() => {
						this.previewOpen = !this.previewOpen;
					}}
				>
					${this.previewOpen ? chevronDown : chevronUp}
				</button>
				<div style=${styleMap(previewStyles)}>
					${unsafeHTML(this.previewContent)}
				</div>
			</div>
			<settings-component></settings-component>
		`;
	}

	/**
	 * Yields an iterable of active vault names
	 */
	private async * getVaultsIterable(): AsyncIterable<Vault | null> {
		const vaults = await this.storage.getVaults();
		const activeVaults = vaults.filter((vault) => vault.active);

		const activeVaultsWithErrors = activeVaults.map((vault) => {
			return {...vault, error: this.errors.some((errorVault) => _.isEqual(errorVault, vault))};
		})

		// If there are active vaults, yield the names. Otherwise yield null.
		if(activeVaultsWithErrors.length > 0) {
			for await(const vault of activeVaultsWithErrors) {
				yield vault;
			}
		}
		else yield null;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'popup-component': PopupComponent;
	}
}
