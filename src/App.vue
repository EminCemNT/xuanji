<script>
export default {
  onLaunch: function () {
    console.log('玄机阁 App Launch')
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  }
}
</script>

<style>
/* ===== 全局 CSS 变量（从 H5 迁移） ===== */
page {
  --bg-deep: #0d0e1f;
  --bg-mid: #1a1b3c;
  --gold: #d4af37;
  --gold-light: #f0d060;
  --moon: #f5f0e8;
  --text-main: #e8e0f0;
  --text-sub: #a09ab8;
  --glass-bg: rgba(26, 27, 60, 0.65);
  --glass-border: rgba(212, 175, 55, 0.25);
  --radius: 16px;

  background-color: var(--bg-deep);
  color: var(--text-main);
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 14px;
  line-height: 1.6;
  box-sizing: border-box;
}

view, text {
  box-sizing: border-box;
}

/* 毛玻璃卡片基础样式 */
.glass-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 16px;
}

/* 标签样式 */
.tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  margin: 2px 4px;
}
.tag-yi {
  background: rgba(76, 175, 80, 0.15);
  color: #81c784;
  border: 1px solid rgba(76, 175, 80, 0.25);
}
.tag-ji {
  background: rgba(244, 67, 54, 0.15);
  color: #e57373;
  border: 1px solid rgba(244, 67, 54, 0.25);
}
</style>
