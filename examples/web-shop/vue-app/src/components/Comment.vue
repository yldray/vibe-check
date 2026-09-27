<template>
  <div class="comment">
    <strong>{{ comment.author }}</strong>
    <div v-html="comment.body"></div>
  </div>
</template>
<script setup>
defineProps({ comment: Object })
</script>
