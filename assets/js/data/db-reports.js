/**
 * @owner SV3
 * @spec §8.3, §9.4, §10.4 AI Reports Persistence Domain API
 */
(function (window) {
  'use strict';
  const IP = window.IP;
  const DB = IP.DB;

  DB.extend('reports', {
    listAIReports: function (filter) {
      const f = filter || {};
      const st = DB._rawState();
      let list = st.aiReports.slice();
      if (f.type && f.type !== 'all') {
        list = list.filter(function (r) { return r.type === f.type; });
      }
      return list;
    },

    getAIReport: function (id) {
      if (!id) return null;
      const st = DB._rawState();
      return st.aiReports.find(function (r) { return r.id === id; }) || null;
    },

    saveAIReport: function (report) {
      const st = DB._rawState();
      const r = report || {};
      if (!r.summary || !String(r.summary).trim()) {
        return DB.err('VALIDATION', 'Báo cáo AI không có nội dung tóm tắt để lưu.');
      }

      const record = {
        id: IP.Utils.uid('rpt'),
        type: r.type === 'forecast' ? 'forecast' : 'dashboard',
        period: r.period || '90d',
        horizon: Number(r.horizon || 90),
        scenario: r.scenario || 'base',
        summary: String(r.summary).trim(),
        highlights: Array.isArray(r.highlights) ? r.highlights : [],
        assumptions: r.assumptions || { recoveryRate: 65, delayDays: 10, includePending: false },
        confidence: ['high', 'medium', 'low'].includes(r.confidence) ? r.confidence : 'high',
        createdAt: new Date().toISOString(),
        createdBy: DB.currentActorId()
      };

      st.aiReports.unshift(record);
      if (DB.addActivity) {
        DB.addActivity({
          entityType: 'settings',
          entityId: record.id,
          type: 'ai_report',
          message: 'Đã lưu báo cáo tóm tắt dòng tiền AI (' + (record.type === 'forecast' ? 'Dự báo kịch bản' : 'Tổng quan công nợ') + ').'
        });
      }
      if (DB.addNotification) {
        DB.addNotification({
          role: 'manager',
          type: 'system',
          title: 'Đã lưu báo cáo dòng tiền AI (' + record.period + ')',
          message: record.summary.slice(0, 110) + '...',
          targetRouteKey: record.type === 'forecast' ? 'manager.forecast' : 'manager.dashboard',
          targetParams: {}
        });
      }

      DB._commit();
      return DB.ok(record);
    },

    deleteAIReport: function (id) {
      const st = DB._rawState();
      const idx = st.aiReports.findIndex(function (r) { return r.id === id; });
      if (idx < 0) return DB.err('NOT_FOUND', 'Không tìm thấy báo cáo AI.');
      st.aiReports.splice(idx, 1);
      DB._commit();
      return DB.ok({ deletedId: id });
    }
  });
})(window);
