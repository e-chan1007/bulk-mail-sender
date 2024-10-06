<script setup lang="ts">
const props = defineProps<{
  open: boolean;
}>();
const { open } = useVModels(props);
</script>

<template>
  <UModal v-model="open">
    <div class="px-4 py-12 flex flex-col gap-8">
      <h1 class="text-xl text-center">
        ログイン
      </h1>
      <UButton
        to="/login"
        external
        icon="google"
        block
        color="primary"
        variant="solid"
        label="Button"
        :trailing="false">
        Googleでログイン
      </UButton>
    </div>
  </UModal>
</template>
