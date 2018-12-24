// overwrite the `languages` property to use a custom getter
// driver.execute_script("var s=window.document.createElement('script');
// s.src='javascriptFirefox.js';
// window.document.head.appendChild(s);")

// Overwrite the `plugins` property to use a custom getter.
Object.defineProperty(navigator, 'plugins', {
	get: function() {
		var plugin1 = { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer", description: "Portable Document Format", length: 1 };
		var plugin2 = { name: "Chrome PDF Viewer", filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai", description: "", length: 1};
		var plugin3 = { name: "Native Client", filename: "internal-nacl-plugin", description: "", length: 2};

		return [plugin1, plugin2, plugin3];
	}
})