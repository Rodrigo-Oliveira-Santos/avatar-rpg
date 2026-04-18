#!/bin/bash
# Create a new Vue component
# Usage: ./new-component.sh ComponentName

if [ -z "$1" ]; then
    echo "Usage: ./new-component.sh ComponentName"
    exit 1
fi

COMPONENT_NAME="$1"
COMPONENT_PATH="frontend/src/components/${COMPONENT_NAME}.vue"

if [ -f "$COMPONENT_PATH" ]; then
    echo "Component already exists: $COMPONENT_PATH"
    exit 1
fi

cat > "$COMPONENT_PATH" << 'EOF'
<template>
  <div class="component-container">
    <!-- Component content -->
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Props
const props = defineProps({
  // Define props here
})

// Emits
const emit = defineEmits([
  // Define emits here
])

// Component logic
</script>

<style scoped>
.component-container {
  /* Component styles */
}
</style>
EOF

echo "Created component: $COMPONENT_PATH"
