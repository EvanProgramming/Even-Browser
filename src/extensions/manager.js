const { session } = require('electron');
const fs = require('fs');
const path = require('path');

class ExtensionManager {
  constructor() {
    this.extensionsPath = path.join(process.userData, 'extensions');
    this.whitelist = this.loadWhitelist();
    this.init();
  }

  init() {
    this.createExtensionsDirectory();
    this.loadInstalledExtensions();
  }

  createExtensionsDirectory() {
    if (!fs.existsSync(this.extensionsPath)) {
      fs.mkdirSync(this.extensionsPath, { recursive: true });
    }
  }

  loadWhitelist() {
    try {
      const whitelistPath = path.join(__dirname, 'whitelist.json');
      const data = fs.readFileSync(whitelistPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load extension whitelist:', error);
      return [];
    }
  }

  loadInstalledExtensions() {
    try {
      const extensionDirs = fs.readdirSync(this.extensionsPath);
      extensionDirs.forEach(extensionId => {
        const extensionPath = path.join(this.extensionsPath, extensionId);
        if (fs.statSync(extensionPath).isDirectory()) {
          this.loadExtension(extensionId, extensionPath);
        }
      });
    } catch (error) {
      console.error('Failed to load installed extensions:', error);
    }
  }

  loadExtension(extensionId, extensionPath) {
    try {
      session.defaultSession.loadExtension(extensionPath, {
        allowFileAccess: true
      }).then((extension) => {
        console.log(`Extension loaded: ${extension.name} (${extensionId})`);
      }).catch((error) => {
        console.error(`Failed to load extension ${extensionId}:`, error);
      });
    } catch (error) {
      console.error(`Error loading extension ${extensionId}:`, error);
    }
  }

  async installExtension(extensionId) {
    try {
      const extensionInfo = this.whitelist.find(ext => ext.id === extensionId);
      if (!extensionInfo) {
        throw new Error(`Extension ${extensionId} not in whitelist`);
      }

      const extensionPath = path.join(this.extensionsPath, extensionId);
      if (fs.existsSync(extensionPath)) {
        console.log(`Extension ${extensionId} is already installed`);
        return;
      }

      // TODO: Implement CRX download and extraction
      // For now, just create a placeholder directory
      fs.mkdirSync(extensionPath, { recursive: true });
      
      // Create a manifest.json placeholder
      const manifest = {
        manifest_version: 3,
        name: extensionInfo.name,
        version: '1.0.0',
        description: extensionInfo.description,
        action: {
          default_icon: {
            16: 'icon16.png',
            48: 'icon48.png',
            128: 'icon128.png'
          }
        }
      };

      fs.writeFileSync(
        path.join(extensionPath, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      // Load the extension
      this.loadExtension(extensionId, extensionPath);
      console.log(`Extension ${extensionId} installed successfully`);
    } catch (error) {
      console.error(`Failed to install extension ${extensionId}:`, error);
    }
  }

  getFeaturedExtensions() {
    return this.whitelist.filter(ext => ext.featured);
  }

  getExtensionById(extensionId) {
    return this.whitelist.find(ext => ext.id === extensionId);
  }
}

module.exports = ExtensionManager;