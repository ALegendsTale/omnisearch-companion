import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import browser from 'webextension-polyfill';
import Showdown from "showdown";
import { ChevronDown, ChevronUp, createElement } from "lucide";
import sanitize from "sanitize-html";
import { getShortString } from '../utils/helpers';
import '../components/header-component';
import '../components/Settings/settings-component';
import '../components/note-item';
import { ResultNoteApi } from '../types/OmnisearchTypes';

import { SettingsComponent } from '../components/Settings/settings-component';
import { styleMap } from 'lit/directives/style-map.js';

type Notes = { query: string, notes: ResultNoteApi[] };

@customElement('popup-component')
export class PopupComponent extends LitElement {
	static override styles = [
		css`
			:host {
				display: flex;
				flex-direction: column;
				justify-content: flex-start;
				align-items: center;
				width: 100%;
				height: 100vh;
			}

			#preview-wrapper {
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
					font-size: 80%;
					font-family: Inter;
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

			#query-wrapper {
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				margin: 20px;
				max-width: 360px;
				gap: 6px;

				& > h3 {
					color: var(--light-purple);
					font-weight: bold;
					font-family: Inter;
					font-size: 1.25rem;
					margin: 0;
					padding: 0;
				}

				div {
					display: flex;
					flex-direction: row;
					justify-content: flex-start;
					align-items: center;

					img {
						display: none;
						width: 20px;
						height: 20px;
						border-radius: 314px;
					}

					h3 {
						font-weight: 400;
						font-family: Inter;
						font-size: 1rem;
						margin: 0;
						padding: 0;
						/* Leave room for left & right margins + favicon */
						max-width: 340px;
						text-wrap: nowrap;
					}
				}
			}

			#content {
				display: flex;
				flex-direction: column;
				background-color: var(--text-box);
				border-radius: 5px;
				font-size: 1rem;
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
					font-family: Inter;
					font-size: 1rem;
					color: var(--text);
					text-align: center;
					max-width: 400px;
				}
			}
		`,
	];

	@property({ type: String, reflect: true })
	query: string = '';
	@property({ type: Array })
	notes: ResultNoteApi[] = [];

	@query('settings-component')
	settings!: SettingsComponent;
	@query('#query-wrapper')
	queryWrapper!: HTMLDivElement;

	@state()
	previewOpen: boolean = false;

	@state()
	previewContent: string = '';

	// Create new markdown > HTML converter object
	showdown = new Showdown.Converter();

	override connectedCallback(): void {
		super.connectedCallback();

		// Create & connect port to `bgScript`
		let popupPort = browser.runtime.connect({ name: 'popup' });
		if(popupPort.onMessage.hasListener(this.receiveMessage)) popupPort.onMessage.removeListener(this.receiveMessage);
		// Create notes from received message
		popupPort.onMessage.addListener((res: Notes) => this.receiveMessage(res));

		this.showdown.setFlavor('github');
	}

	/**
	 * Receive message from background script
	 */
	receiveMessage({ query, notes }: Notes) {
		this.query = query;
		this.notes = notes;
		console.log(query, notes);
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
				return html`<p>No notes match this query.</p>`;
			}
			else {
				return this.notes.map((note) => {
					return html`
						<note-item
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
			<header-component
				@buttonclicked=${() => this.settings.toggleDisplay()}
			></header-component>
			<div
				id="query-wrapper"
				title=${this.query}
			>
				<h3>Search Query:</h3>
				<div>
					<img
						src=${urlHasPath ? favicon : ''}
						style=${styleMap(faviconStyles)}
					>
					<h3>
						${isQueryURL ? this.getShortURL(new URL(this.query), urlHasPath) : this.query ? getShortString(this.query) : nothing}
					</h3>
				</div>
			</div>
			<ol id="content">
				${omnisearchContent()}
			</ol>
			<div id="preview-wrapper">
				<button
					title=${`${this.previewOpen ? 'Close' : 'Open'} preview window`}
					@click=${() => {
						this.previewOpen = !this.previewOpen;
					}}
				>
					${this.previewOpen ? chevronDown : chevronUp}
				</button>
				<div style=${styleMap(previewStyles)}>
					${this.previewContent}
				</div>
			</div>
			<settings-component></settings-component>
		`;
	}

	/**
	 * Returns a shortened URL path
	 */
	getShortURL(url: URL, urlHasPath: boolean){
		// Return host if url has no path
		if(!urlHasPath) return url.host;
		const path = url.pathname;

		return getShortString(path);
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'popup-component': PopupComponent;
	}
}
