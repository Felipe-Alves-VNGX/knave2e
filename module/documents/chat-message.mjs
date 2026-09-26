import { onDamageFromChat, onLinkFromChat } from "../helpers/items.mjs";

export default class Knave2eChatMessage extends ChatMessage {
  async renderHTML(options = {}) {
    const html = await super.renderHTML(options);

    html.addEventListener("click", (event) => {
      const damageButton = event.target.closest(".item-button.damage.chat");
      if (damageButton) {
        return onDamageFromChat.call(this, { preventDefault: () => event.preventDefault(), currentTarget: damageButton });
      }

      const contentLink = event.target.closest(".content-link");
      if (contentLink) {
        return onLinkFromChat.call(this, { preventDefault: () => event.preventDefault(), currentTarget: contentLink });
      }
    });

    return html;
  }
}
