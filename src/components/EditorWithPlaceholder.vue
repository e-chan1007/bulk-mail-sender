<script lang="ts" setup>
import { Extension, mergeAttributes, PasteRule } from "@tiptap/core";
import TiptapMention from "@tiptap/extension-mention";

import { suggestion } from "~/lib/tiptapMentionSuggestion";
import { createPlaceholder, placeholderPattern, type Placeholder } from "~/types/Placeholder";

const { placeholders, singleLine = false, ...props } = defineProps<{
  modelValue: string;
  placeholders: Placeholder[];
  singleLine?: boolean;
}>();

const { modelValue } = useVModels(props);

const editor = useEditor({
  content: `<p>${modelValue.value}</p>`,
  extensions: [
    TiptapDocument,
    TiptapParagraph.extend({
      priority: 0,
      addKeyboardShortcuts() {
        return { "Enter": () => singleLine || this.editor.commands.insertContent("<br>") };
      }
    }),
    TiptapText,
    !singleLine ? TiptapHardBreak : new Extension(),
    TiptapMention.configure({
      deleteTriggerWithBackspace: true,
      renderHTML({ options, node }) {
        return [
          "span",
          mergeAttributes({ class: "bg-primary-200 dark:bg-primary-700 mx-0.5 px-2 rounded-full font-bold" }, options.HTMLAttributes),
          node.attrs.label ?? node.attrs.id
        ];
      },
      renderText({ node }) {
        return createPlaceholder(node.attrs.id);
      },
      suggestion: {
        ...suggestion,
        char: "#",
        items({ query }) {
          return placeholders.filter(item => item.label.toLowerCase().includes(query.toLowerCase()));
        }
      }
    }),
    new Extension({
      addPasteRules() {
        return [
          new PasteRule({
            find: placeholderPattern,
            handler: ({ match, chain, range }) => {
              const placeholder = placeholders.find(item => item.id === Number(match[1]));
              if (!placeholder) return;

              chain().deleteRange(range).insertContentAt(range.from, {
                type: "mention",
                attrs: placeholder
              });
            }
          })
        ];
      }
    })
  ]
});

editor.value?.on("update", () => {
  modelValue.value = editor.value?.getText() ?? "";
});

onMounted(() => {
  editor.value?.on("update", () => {
    modelValue.value = editor.value?.getText() ?? "";
  });
});

const insertPlaceholderActions = computed(() => [placeholders.map(placeholder => ({
  label: placeholder.label,
  click: () => {
    editor.value?.chain().focus().insertContent({
      type: "mention",
      attrs: placeholder
    }).run();
  }
}))]);

const reset = () => {
  editor.value?.chain().setContent("<p></p>", true).run();
};

defineExpose({ reset });
</script>

<template>
  <UDropdown :items="insertPlaceholderActions">
    <UButton trailing-icon="material-symbols:add" class="mb-3" :disabled="placeholders.length === 0">
      プレースホルダーを追加
    </UButton>
  </UDropdown>
  <TiptapEditorContent
    :editor="editor" class="
  rounded ring-1 ring-gray-300 dark:ring-gray-700 leading-7
  bg-white dark:bg-gray-900
  focus-within:ring-2 focus-within:ring-primary focus-within:dark:ring-primary *:px-2.5 *:py-1.5 *:outline-none
  " :class="singleLine ? '*:min-h-4' : '*:min-h-60'" />
</template>
