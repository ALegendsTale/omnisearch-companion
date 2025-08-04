import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js"
import { globalStyles } from "../styles/styles";

@customElement("note-item")
export class NoteItem extends LitElement {
	static override styles = [
		globalStyles,
		css`
			:host {
				margin-bottom: 7px;
			}

			a {
				color: var(--text);
				text-decoration: none;
				cursor: pointer;
			}

			a:hover {
				color: var(--highlight);
			}
		`
	];

	override render() {
		return html`
			<li>
				<a
					@click=${() => {
						const clickNote = new CustomEvent('clicknote');
						this.dispatchEvent(clickNote);
					}}
				>
					<slot></slot>
				</a>
			</li>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"note-item": NoteItem;
	}
}
