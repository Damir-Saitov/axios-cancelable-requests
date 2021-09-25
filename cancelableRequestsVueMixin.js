import Vue from 'vue';

import {
  registerComponent,
  unregisterComponent,
} from '@/plugins/cancelableRequests';

/**
 * @type {import("node_modules/vue/types/index").ComponentOptions}
 */
export default {
  data() {
    return {
      cancelableRequestsMixinData: { componentUid: null },
    };
  },
  created() {
    let componentUid;
    if (this.cancelableRequestsMixinData && this.cancelableRequestsMixinData.componentUid) {
      componentUid = this.cancelableRequestsMixinData.componentUid;
    } else {
      componentUid = this._uid;
      this.cancelableRequestsMixinData = { componentUid };
    }
    registerComponent(componentUid);
  },
  beforeDestroy() {
    unregisterComponent(this.cancelableRequestsMixinData.componentUid, true);
  },
};
