import { VueRenderer } from "@tiptap/vue-3";
import tippy from "tippy.js";

import MentionList from "./MentionList.vue";

import type { MentionOptions } from "@tiptap/extension-mention";

const suggestion: MentionOptions["suggestion"] = {
  render: () => {
    let component: VueRenderer;
    let popup: ReturnType<typeof tippy>;

    return {
      onStart: props => {
        component = new VueRenderer(MentionList, {
          props,
          editor: props.editor
        });

        if (!props.clientRect) {
          return;
        }

        // @ts-expect-error tippy types might be incorrect
        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start"
        });
      },

      onUpdate(props) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        // @ts-expect-error tippy types might be incorrect
        popup[0].setProps({ getReferenceClientRect: props.clientRect });
      },

      onKeyDown(props) {
        if (props.event.key === "Escape") {
          popup[0].hide();

          return true;
        }

        return component.ref?.onKeyDown(props);
      },

      onExit() {
        popup[0].destroy();
        component.destroy();
      }
    };
  }
};

export { suggestion };
