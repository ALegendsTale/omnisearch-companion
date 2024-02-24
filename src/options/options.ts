import { Header } from "../Header";
import { Settings } from "../components/Settings/Settings";

// Define settings / header in case they haven't been defined in popup yet
if(customElements.get('settings-component') == undefined) customElements.define('settings-component', Settings);
if(customElements.get('header-component') == undefined) customElements.define('header-component', Header);

document.querySelector('body')?.appendChild(new Settings(true));
