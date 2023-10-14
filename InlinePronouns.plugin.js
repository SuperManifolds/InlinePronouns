/**
 * @name InlinePronouns
 * @description Adds inline pronouns to Discord messages
 * @version 1.0.0
 * @author SuperManifolds
 * @authorId 385879184276193290
 * @source https://github.com/SuperManifolds/InlinePronounns
 * @updateUrl https://raw.githubusercontent.com/https://github.com/SuperManifolds/InlinePronouns/main/InlinePronouns.plugin.js
 */

const config = {
	main: "index.js",
	id: "",
	name: "InlinePronouns",
	author: "SuperManifolds",
	authorId: "385879184276193290",
	authorLink: "https://github.com/SuperManifolds/",
	version: "1.0.0",
	description: "Adds inline pronouns to Discord messages",
	website: "",
	source: "https://github.com/SuperManifolds/InlinePronouns/",
	changelog: [],
};
class Dummy {
	constructor() { this._config = config; }
	start() { }
	stop() { }
}

if (!global.ZeresPluginLibrary) {
	BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.name ?? config.info.name} is missing. Please click Download Now to install it.`, {
		confirmText: "Download Now",
		cancelText: "Cancel",
		onConfirm: () => {
			require("request").get("https://betterdiscord.app/gh-redirect?id=9", async (err, resp, body) => {
				if (err) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
				if (resp.statusCode === 302) {
					require("request").get(resp.headers.location, async (error, response, content) => {
						if (error) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
						await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), content, r));
					});
				}
				else {
					await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
				}
			});
		}
	});
}

module.exports = !global.ZeresPluginLibrary ? Dummy : (([Plugin, Api]) => {
	const plugin = (Plugin, Library) => {
		const { Patcher, DOMTools, WebpackModules, Utilities, DiscordModules: { React, UserStore, ChannelStore } } = Library

		function getMangled(filter) {
			const target = WebpackModules.getModule(m => Object.values(m).some(filter), {searchGetters: false});
			return target ? [
				target,
				Object.keys(target).find(k => filter(target[k]))
			] : [];
		}

		const Selectors = {
			BotTag: {
				...WebpackModules.getByProps('botTag', 'botTagCozy'),
				botTagVerified: WebpackModules.getByProps('botTagVerified').botTagVerified
			}
		};

		WebpackModules.getByProps('fetchProfile')

		const BotTag = getMangled(m => m?.toString && m.toString().includes('BOT_TAG_BOT'));
		const UNIQUE_TAG = 'PronounTag';

		const ProfileActions = WebpackModules.getByProps('getUserProfile');


		const MessageHeader = getMangled(m => m?.toString && m.toString().includes('roleDot') && m.toString().includes('preload'));

		return class extends Plugin {
			constructor(meta) {

				super(meta)
				this.meta = meta
				this.defaultSettings = {}
			}

			onStart() {
				this.patchMessages();
				this.patchBotTags()
				DOMTools.addStyle(this.meta.id, `
					.PronounTag {
						background-color: #444;
						text-transform: none;
					}
				`)
			}

			onStop() {
				DOMTools.removeStyle(this.meta.id)
				Patcher.unpatchAll()
			}
			patchMessages() {
				Patcher.before(...MessageHeader, (self, props) => {
					const { decorations, message } = props[0];
					if (!decorations || typeof decorations[1] !== 'object' || !'length' in decorations[1]) return

					let result = ProfileActions.getUserProfile(message.author.id);
					if (!result || !result.pronouns) return;

					decorations[1].unshift(React.createElement(BotTag[0][BotTag[1]], {
						className: `${Selectors.BotTag.botTagCozy} ${UNIQUE_TAG}`,
						useRemSizes: true,
						type: 'IN_VOICE',
						pronouns: result.pronouns
					}));
				});
			}

			patchBotTags() {
				Patcher.after(...BotTag, (self, args, value) => {
					if (!value.props?.className?.includes(UNIQUE_TAG)) return;

					const TagContainer = Utilities.findInReactTree(value, e => e.children?.some(c => typeof c?.props?.children === 'string'));

					console.log(args)
					TagContainer.children.find(c => typeof c?.props?.children === 'string').props.children = args[0].pronouns;
				});
			}
		}
	};
	return plugin(Plugin, Api);
})(global.ZeresPluginLibrary.buildPlugin(config));
/*@end@*/
