<script setup lang="ts">
const { items, command } = defineProps<{ items: { id: string, label: string }[], command:(props: object) => void }>();

const focusIndex = ref(0);

const selected = ref<typeof items[number]>();

watch(selected, () => {
  if (!selected.value) return;

  command(selected.value);
});

const onKeyDown = ({ event }: { event: KeyboardEvent }) => {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    focusIndex.value = (focusIndex.value + 1) % items.length;
    return true;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    focusIndex.value = (focusIndex.value + items.length - 1) % items.length;
    return true;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    selected.value = items[focusIndex.value];
    return true;
  }

  return false;
};

defineExpose({ onKeyDown });
</script>

<template>
  <div class="focus:outline-none overflow-y-auto scroll-py-1 ring-1 ring-gray-200 dark:ring-gray-700 rounded-md shadow-lg bg-white dark:bg-gray-800 min-w-48 p-1">
    <button
      v-for="(item, index) in items"
      :key="item.id"
      :class="{ 'text-gray-900 bg-gray-100 dark:bg-gray-900 dark:text-gray-white': index === focusIndex }"
      class="
        group flex items-center gap-1.5 w-full px-1.5 py-1.5 text-sm rounded-md text-gray-700 dark:text-gray-200
        hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-900 dark:hover:text-gray-white
      "
      @click="selected = item"
      @keydown="event => onKeyDown({ event })">
      {{ item.label }}
    </button>
  </div>
</template>
