import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js"

@customElement("note-item")
export class NoteItem extends LitElement {
	static override styles = [
		css`
			:host {
				margin-bottom: 7px;
			}

			li {
				font-family: Inter;
			}

			a {
				color: var(--text);
				text-decoration: none;
				cursor: pointer;
				font-family: Inter;
				font-size: 1rem;
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
