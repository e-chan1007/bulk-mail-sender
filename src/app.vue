<script lang="ts" setup>
import { read, utils, set_cptable } from "xlsx";
import * as cptable from "xlsx/dist/cpexcel.full.mjs";

import { EditorWithPlaceholder } from "#components";
import { placeholderPattern, type Placeholder } from "~/types/Placeholder";

import type { ComponentPublicInstance } from "vue";
import type { WorkBook } from "xlsx";
set_cptable(cptable);

useSeoMeta({ title: "メール差し込み送信" });

useHead({
  link: [
    { rel: "icon", type: "image/png", href: "/favicon.png" }
  ]
});

type FileType = "csv" | "xlsx" | "xls";
const fileType = ref<FileType | null>(null);
const workbook = ref<WorkBook | null>(null);
const sheetNames = ref<string[]>([]);
const selectedSheet = ref<string>();

const { data: sendAsList, error: errorFetchSendAsList } = useFetch("/api/gmail/sendas");

const mailFrom = ref("");
const mailTo = ref("");
const mailSubject = ref("");
const mailBody = ref("");

watchEffect(() => {
  if (sendAsList.value && sendAsList.value.length > 0) {
    mailFrom.value = sendAsList.value.find(v => v.default)?.address || sendAsList.value[0].address;
  }
});

const accountAddress = computed(() => sendAsList.value?.find(v => v.primary)?.address || sendAsList.value?.[0].address);

const onFileSelected = (files: FileList) => {
  if (!files) return;
  const file = files[0];
  const reader = new FileReader();
  reader.onload = () => {
    const data = reader.result as ArrayBuffer;

    const workbookData = read(data, { codepage: 65001 });
    workbook.value = workbookData;
    fileType.value = file.name.split(".").pop()?.toLowerCase() as FileType;
    sheetNames.value = workbookData.SheetNames;
    selectedSheet.value = workbookData.SheetNames[0];
  };
  reader.readAsArrayBuffer(file);
};

const sheetData = computed<string[][]>(() => {
  if (!workbook.value || !selectedSheet.value) return [];
  return utils.sheet_to_json(workbook.value.Sheets[selectedSheet.value], { header: 1 }) as string[][];
});

const placeholders = computed<Placeholder[]>(() => {
  if (!workbook.value || !selectedSheet.value) return [];
  if (sheetData.value.length === 0) return [];
  const header = sheetData.value[0];
  const encodeCol = (col: number) => fileType.value === "csv" ? `${col + 1}列目` : `${utils.encode_col(col)}列`;
  return header.map((label, col) => ({ label: `${label} (${encodeCol(col)})`, id: col }));
});

const computedMailTo = computed(() =>
  sheetData.value.slice(1).map(row =>
    mailTo.value.replace(placeholderPattern, (_, id) => {
      const col = Number(id);
      return row[col] ?? "";
    }))
);

const computedMailSubject = computed(() =>
  sheetData.value.slice(1).map(row =>
    mailSubject.value.replace(placeholderPattern, (_, id) => {
      const col = Number(id);
      return row[col] ?? "";
    }))
);

const computedMailBody = computed(() =>
  sheetData.value.slice(1).map(row =>
    mailBody.value.replace(placeholderPattern, (_, id) => {
      const col = Number(id);
      return row[col] ?? "";
    }))
);

const toast = useToast();

const isSending = ref(false);

const sendActions = [{
  label: "下書きとして保存",
  click: async () => {
    isSending.value = true;
    const mails = computedMailTo.value.map((to, i) => ({
      from: mailFrom.value,
      to,
      subject: computedMailSubject.value[i],
      body: computedMailBody.value[i]
    }));

    await $fetch("/api/gmail/send?mode=draft", {
      method: "POST",
      body: mails
    }).catch(() => {
      toast.add({ title: "保存に失敗しました", color: "red" });
    });

    toast.add({
      title: "保存しました",
      actions: [{
        variant: "outline",
        color: "primary",
        label: "Gmailを開く",
        click: () => {
          navigateTo(`https://mail.google.com/mail/u/${accountAddress.value}/#drafts`, { external: true, open: { target: "_blank" } });
        }
      }]
    });
    isSending.value = false;
  }
}, {
  label: "送信",
  click: async () => {
    isSending.value = true;
    const mails = computedMailTo.value.map((to, i) => ({
      from: mailFrom.value,
      to,
      subject: computedMailSubject.value[i],
      body: computedMailBody.value[i]
    }));

    await $fetch("/api/gmail/send?mode=send", {
      method: "POST",
      body: mails
    }).catch(() => {
      toast.add({ title: "送信に失敗しました", color: "red" });
    });

    toast.add({
      title: "送信しました",
      actions: [{
        variant: "outline",
        color: "primary",
        label: "Gmailを開く",
        click: () => {
          navigateTo(`https://mail.google.com/mail/u/${accountAddress.value}/#sent`, { external: true, open: { target: "_blank" } });
        }
      }]
    });
    isSending.value = false;
  }
}];
type Editor = InstanceType<typeof EditorWithPlaceholder>;
const editorRefs = ref<Editor[]>([]);
const setEditorRef = (el: Element | ComponentPublicInstance | null) => {
  editorRefs.value.push(el as Editor);
};

const reset = () => {
  editorRefs.value?.forEach(editor => {
    editor.reset();
  });
};

const page = ref(1);
</script>

<template>
  <div>
    <UContainer class="flex flex-col gap-8 py-8">
      <div class="text-right">
        <UButton to="/login" variant="outline" external>
          アカウントを切り替える
        </UButton>
      </div>
      <LoginModal v-if="errorFetchSendAsList" :open="!!errorFetchSendAsList" />

      <h1 class="font-bold">
        送信設定
      </h1>

      <UFormGroup v-if="sendAsList" label="送信元">
        <USelect v-model="mailFrom" :options="sendAsList" option-attribute="label" value-attribute="address" size="lg" />
      </UFormGroup>
      <UFormGroup label="差し込みデータ">
        <UInput
          type="file"
          accept=".csv,.xlsx,.xls"
          size="lg"
          icon="lucide:file-spreadsheet"
          @change="onFileSelected" />
      </UFormGroup>
      <UFormGroup v-if="workbook && fileType !== 'csv'" label="シート名">
        <USelect
          v-model="selectedSheet"
          :options="sheetNames"
          label="シート名"
          size="lg" />
      </UFormGroup>
      <UFormGroup label="宛先">
        <EditorWithPlaceholder :ref="setEditorRef" v-model="mailTo" single-line :placeholders="placeholders" />
      </UFormGroup>
      <UFormGroup label="件名">
        <EditorWithPlaceholder :ref="setEditorRef" v-model="mailSubject" single-line :placeholders="placeholders" />
      </UFormGroup>
      <UFormGroup label="本文">
        <EditorWithPlaceholder :ref="setEditorRef" v-model="mailBody" :placeholders="placeholders" />
      </UFormGroup>

      <UDivider />

      <h1 class="font-bold">
        プレビュー
      </h1>
      <UPagination v-model="page" :page-count="1" :total="computedMailBody.length" size="lg" />
      <UCard>
        <div class="flex flex-col gap-2">
          <p>宛先: {{ computedMailTo[page - 1] || "" }}</p>
          <p>件名: {{ computedMailSubject[page - 1] || "" }}</p>
          <UDivider />
          <p class="leading-7 whitespace-pre">
            {{ computedMailBody[page - 1] || "" }}
          </p>
        </div>
      </UCard>

      <div class="flex flex-row justify-between">
        <UButton label="リセット" variant="outline" size="lg" @click="reset" />
        <UButtonGroup size="lg" orientation="horizontal">
          <UButton :label="sendActions[0].label" :disabled="computedMailBody.length === 0" :loading="isSending" @click="sendActions[0].click" />
          <UDropdown :items="[sendActions]">
            <UButton icon="i-heroicons-chevron-down-20-solid" :disabled="computedMailBody.length === 0 || isSending" />
          </UDropdown>
        </UButtonGroup>
      </div>
    </UContainer>
    <UNotifications />
  </div>
</template>
