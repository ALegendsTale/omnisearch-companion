import { Settings } from "../components/Settings/Settings";
customElements.define('settings-component', Settings);

const settings = new Settings(true);
document.querySelector('body')?.appendChild(settings);