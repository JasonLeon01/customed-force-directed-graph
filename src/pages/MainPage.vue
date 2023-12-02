<template>
  <div
    class="container"
    v-loading="loading || loading_ph"
    element-loading-text="Computing..."
  >
    <nav class="navBar">
      <div class="nav-title">信息交互模型</div>
      <div class="nav-button-box">

      </div>
    </nav>
    <div
      :class="['content-box', { notEditMode: !editMode }]"
      @transitionend="handleTransitionEnd"
      :key="refreshFlag"
    >
      <div class="loading-mask" v-if="error.state || error_ph.state">
        <div class="introduction">
          <div></div>

          <div></div>
        </div>
      </div>

      <div v-show="editMode">
        <BaseCard v-show="animationDone">
          <div v-show="animationDone">
            <div class="base-mode" v-show="controlPanelMode === 'base'">
            
              <StatisticsGraph ref="controlGraph"></StatisticsGraph>
            </div>
            <div class="table-mode" v-if="controlPanelMode === 'table'">
              <MiniTable></MiniTable>
            </div>
          </div>
        </BaseCard>
      </div>

      <div class="force-graph-box">
        <transition
          name="forceAnimation"
          mode="out-in"
          @after-leave="handleForceTransitionEnd"
        >
          <ForceDirectedGraph
            ref="forceGraph"
            v-show="!photoMode"
          ></ForceDirectedGraph>
        </transition>

        <TreeGraph v-if="photoMode && transitionEnd"></TreeGraph>
      </div>
    </div>
  </div>
</template>
<script>
import ForceDirectedGraph from "@/components/force-directed-graph/ForceDirectedGraph.vue";
import StatisticsGraph from "@/components/control-panel-graph/StatisticsGraph.vue";
import MiniTable from "@/components/control-panel-graph/MiniTable.vue";
import TreeGraph from "@/components/tree-graph/TreeGraph.vue";
import { Tools } from "@element-plus/icons-vue";
import { getHierarchicalData } from '@/processing/get_hierarchical_data.js'
export default {
  components: {
    ForceDirectedGraph,
    StatisticsGraph,
    MiniTable,
    TreeGraph,
    Tools,
  },
  data() {
    return {
      count: 0,
      refreshFlag: false,
      editMode: true,
      animationDone: true,
      controlPanelMode: "base",
      photoMode: false,
      transitionEnd: false,
    };
  },
  computed: {
    loading_ph() {
      return this.$store.getters["tree/loading"];
    },
    error_ph() {
      return this.$store.getters["tree/error"];
    },
    loading() {
      return this.$store.getters["force/loading"];
    },

    error() {
      return this.$store.getters["force/error"];
    },
  },
  watch: {
    error(newVal) {
      if (newVal.state) {
        ElMessage.error(`Error: ${newVal.message}`);
        setTimeout(() => ElMessage.error("Please reload again"), 500);
      }
      if (!newVal.state) {
        ElMessage.success(`Calculation complete`);
      }
    },
    error_ph(newVal) {
      if (newVal.state) {
        ElMessage.error(`Error: ${newVal.message}`);
        setTimeout(() => ElMessage.error("Please reload again"), 500);
      }
      if (!newVal.state) {
        ElMessage.success(`Calculation complete`);
      }
    },
  },
  created() {
    this.autoExecuteFunction();
  },
  provide() {
    return {
      loadAllData: this.loadAllData
    };
  },
  methods: {
    autoExecuteFunction() {
      self = this;
      getHierarchicalData("test.json").then(function(hierarchicalData) {
        window.totalData = hierarchicalData.state[0];
        let treeDataDeferObj = $.Deferred()
        $.when(treeDataDeferObj).then(function() {
          self.loading = false
        }) 
        treeDataDeferObj.resolve().then(function() {
          self.loadAllData()
        })
      })
    },

    loadAllData() {
      self = this;
      self.refreshFlag = true;
          self.$nextTick(() => {
            self.editMode = true;
            self.refreshFlag = false;
            self.photoMode = false;
            self.controlPanelMode = "base";
            // 刷新2个vuex模块的数据，以便2个组件重新加载
            self.$store.commit("force/setFocusState", null);
            self.$store.commit("force/setAllStatesData", null);
            self.$nextTick(() => {
              self.$store.dispatch("force/uploadData2", window.totalData);
            });
          });
    },

    handleForceTransitionEnd() {
      this.transitionEnd = true;
    },
    handleFileChange() {
      const file = event.target.files[0];
      if (file) {
        // 限制为 .xls / .xlsx 类型
        const isExcel =
          file.type ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          file.type === "application/vnd.ms-excel";

        if (!isExcel) {
          ElMessage.warning(`Incorrect file type, please upload again`);
          return;
        }

        this.refreshFlag = true;
        this.$nextTick(() => {
          this.editMode = true;
          this.refreshFlag = false;
          this.photoMode = false;
          this.controlPanelMode = "base";
          // 刷新2个vuex模块的数据，以便2个组件重新加载
          this.$store.commit("force/setFocusState", null);
          this.$store.commit("force/setAllStatesData", null);
          this.$nextTick(() => {
            this.$store.dispatch("force/uploadData", file);
          });
        });
      }
    },

    triggerFileInput() {
      this.$refs.fileInput.value = null;
      this.$refs.fileInput.click();
    },
    stop() {
      this.$refs.forceGraph.simStop();
    },
    restart() {
      this.$refs.forceGraph.restart(
        false,
        this.$refs.forceGraph.focusState,
        null
      );
    },
    toggleEditMode() {
      if (!this.error.state) {
        this.animationDone = false;
        this.editMode = !this.editMode;
      }
    },
    togglePhotoMode() {
      if (!this.error.state) {
        this.transitionEnd = false;
        this.photoMode = !this.photoMode;
        if (this.photoMode) {
          this.$refs.forceGraph.getTreeInfo();

          this.controlPanelMode = "table";
        } else {
          this.$refs.forceGraph.resetTableHighlight();
          this.$refs.forceGraph.simulationRestart(
            this.$refs.forceGraph.globalSimulation
          );
        }
      }
    },

    handleTransitionEnd(event) {
      if (event.propertyName === "grid-template-columns") {
        this.animationDone = true;
      }
    },
  },
};
</script>
<style scoped>
.container {
  height: 100%;
  width: 100%;
  /* background: linear-gradient(#fff, #f8f8f8); */
  /* background-color: #fafafa; */
  background-color: #fff;

  display: flex;
  flex-direction: column;
  gap: 0.4vw;
}
.navBar {
  flex: 5%;
  width: 100%;
  box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.2);
  /* margin-bottom: 0.4vw; */
  /* transition: box-shadow 0.3s; */
  z-index: 5;

  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1vw;
}
/* .navBar:hover {
  box-shadow: 0px 2px 5px 0px #545b7785;
} */
.nav-button-box {
  height: 100%;
  display: flex;
  gap: 0.4vw;
  padding: 0.3vh;
}

.nav-title {
  font-size: 20px;
  font-weight: bold;
  color: #545b77;
  /* font-style: italic; */
}

.loading-mask {
  position: absolute;
  z-index: 9;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  /* background-color: rgba(255, 255, 255, 0.8); */
  background-image: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.9),
      rgba(255, 255, 255, 0.7)
    ),
    url("/pic/display.png");
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
}

.introduction {
  font-size: 6rem;
  line-height: 120%;
  position: absolute;
  top: 15%;
  left: 10%;
  color: #545b77;
}

.content-box {
  flex: 0 0 95%;
  display: grid;
  grid-template-columns: 0fr 10fr;
  transition: all 0.2s ease-in-out;
  position: relative;
  overflow: hidden;
}

.force-graph-box {
  max-height: 95vh;
}

.base-mode {
  height: 100%;
  width: 100%;

  display: flex;
  flex-direction: column;
  gap: 0.3vw;
}
.button-box {
  flex: fit-content;
  display: flex;
  gap: 0px;
  justify-content: left;
}

.table-mode {
  width: 100%;
  height: 100%;
}
.tab-btn {
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  color: #545b77;
  cursor: pointer;
  padding-top: 1.5%;
}
.tab-btn:active,
.tab-btn:hover {
  box-shadow: 0 5px 0px -3px rgba(0, 0, 0, 0.2);
}
.active-tab-btn {
  box-shadow: 0 5px 0px -3px rgba(0, 0, 0, 0.2);
}

.no-padding {
  padding: 0 !important;
}
</style>

<style scoped>
.uploader {
  height: 100%;
}
.nav-icon {
  height: 100%;
  cursor: pointer;
  border: none;
  fill: #545b77;
  border-radius: 2px;
  transition: background-color 0.3s, fill 0.3s;
  color: #fff;
  filter: none;
}

.nav-icon:hover,
.nav-icon:active {
  background-color: #858eb5;
  fill: #fff;
  color: transparent;
  filter: none;
}
.btn {
  border-radius: 12px;
  box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.26);
}
.edit-btn {
  display: flex;
  align-items: center;
  padding: 0.3rem 0.3rem;
}
.active-btn {
  /* background-color: #545b77; */
  /* fill: #fff; */
  color: #fff;
  filter: url(#inset-shadow);
}

.panel-icon {
  cursor: pointer;
  fill: #545b77;
  padding: 0.2rem;

  border-radius: 4px;
  width: 25px;
  height: 25px;
  transition: background-color 0.3s, fill 0.3s;
}

.panel-icon:hover,
.panel-icon:active {
  background-color: #545b77;
  fill: #fff;
  border: none;
}
</style>

<!-- animation -->
<style scoped>
.forceAnimation-enter-from {
  opacity: 0;
  transform: translateY(-30px);
}

.forceAnimation-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.forceAnimation-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.forceAnimation-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.treeAnimation-enter-from {
  opacity: 0;
}

.treeAnimation-enter-to {
  opacity: 1;
}
.treeAnimation-leave-from {
  opacity: 1;
}
.treeAnimation-leave-to {
  opacity: 0;
}

.forceAnimation-enter-active,
.forceAnimation-leave-active {
  transition: all 0.1s ease-out;
}
.treeAnimation-enter-active,
.treeAnimation-leave-active {
  transition: opacity 0.3s ease-out;
}
</style>

<style lang="less">
.config-panel-tab {
  height: 100%;
  --el-tabs-header-height: none;
  --el-color-primary: #545b77;
  padding: 0 1vw;

  .el-tabs__header {
    margin: 0;
  }
  .el-tabs__item {
    color: #aaa;
  }
  .el-tabs__item.is-active {
    color: var(--el-color-primary);
  }
  .el-tabs__item:hover {
    color: var(--el-color-primary);
  }
  .el-tabs__nav,
  .el-tabs__nav-scroll,
  .el-tabs__nav-wrap,
  .el-tabs__header {
    height: 100%;
  }
}
.el-loading-mask {
  --el-color-primary: #545b77;
}
</style>
