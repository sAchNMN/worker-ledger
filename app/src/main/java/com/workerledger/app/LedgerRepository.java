package com.workerledger.app;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.regex.Pattern;

final class LedgerRepository {
    private static final Pattern DATE_PATTERN = Pattern.compile("\\d{4}-\\d{2}-\\d{2}");
    private final LedgerDbHelper helper;

    LedgerRepository(Context context) {
        helper = new LedgerDbHelper(context);
    }

    synchronized String loadSnapshot() throws JSONException {
        SQLiteDatabase db = helper.getReadableDatabase();
        JSONObject snapshot = new JSONObject();
        snapshot.put("settings", readSettings(db).toJson());
        JSONArray entries = new JSONArray();
        try (Cursor cursor = db.query(
                "ledger_entries",
                null,
                null,
                null,
                null,
                null,
                "entry_date DESC, created_at DESC")) {
            while (cursor.moveToNext()) {
                entries.put(readEntry(cursor).toJson());
            }
        }
        snapshot.put("entries", entries);
        return snapshot.toString();
    }

    synchronized void saveSettings(LedgerModels.Settings settings) throws JSONException {
        validateSettings(settings);
        settings.updatedAt = System.currentTimeMillis();
        helper.getWritableDatabase().update(
                "user_settings",
                settingsValues(settings),
                "id = ?",
                new String[]{"1"});
    }

    synchronized long insertEntry(LedgerModels.Entry entry) {
        validateEntry(entry);
        long now = System.currentTimeMillis();
        entry.createdAt = now;
        entry.updatedAt = now;
        return helper.getWritableDatabase().insertOrThrow("ledger_entries", null, entryValues(entry, false));
    }

    synchronized void updateEntry(LedgerModels.Entry entry) {
        validateEntry(entry);
        if (entry.id <= 0) {
            throw new IllegalArgumentException("流水 ID 无效");
        }
        entry.updatedAt = System.currentTimeMillis();
        int changed = helper.getWritableDatabase().update(
                "ledger_entries",
                entryValues(entry, false),
                "_id = ?",
                new String[]{String.valueOf(entry.id)});
        if (changed != 1) {
            throw new IllegalArgumentException("找不到要更新的流水");
        }
    }

    synchronized void deleteEntry(long id) {
        if (id <= 0) {
            throw new IllegalArgumentException("流水 ID 无效");
        }
        int deleted = helper.getWritableDatabase().delete(
                "ledger_entries",
                "_id = ?",
                new String[]{String.valueOf(id)});
        if (deleted != 1) {
            throw new IllegalArgumentException("找不到要删除的流水");
        }
    }

    synchronized void replaceFromSnapshot(String json) throws JSONException {
        JSONObject snapshot = new JSONObject(json);
        LedgerModels.Settings settings = LedgerModels.Settings.fromJson(snapshot.getJSONObject("settings"));
        JSONArray jsonEntries = snapshot.getJSONArray("entries");
        validateSettings(settings);
        LedgerModels.Entry[] entries = new LedgerModels.Entry[jsonEntries.length()];
        for (int index = 0; index < jsonEntries.length(); index += 1) {
            entries[index] = LedgerModels.Entry.fromJson(jsonEntries.getJSONObject(index));
            validateEntry(entries[index]);
        }

        SQLiteDatabase db = helper.getWritableDatabase();
        db.beginTransaction();
        try {
            db.delete("ledger_entries", null, null);
            db.update("user_settings", settingsValues(settings), "id = ?", new String[]{"1"});
            for (LedgerModels.Entry entry : entries) {
                ContentValues values = entryValues(entry, entry.id > 0);
                db.insertOrThrow("ledger_entries", null, values);
            }
            db.setTransactionSuccessful();
        } finally {
            db.endTransaction();
        }
    }

    private LedgerModels.Settings readSettings(SQLiteDatabase db) throws JSONException {
        try (Cursor cursor = db.query("user_settings", null, "id = ?", new String[]{"1"}, null, null, null)) {
            if (!cursor.moveToFirst()) {
                LedgerModels.Settings defaults = LedgerModels.Settings.defaults();
                db.insertOrThrow("user_settings", null, settingsValues(defaults));
                return defaults;
            }
            LedgerModels.Settings settings = new LedgerModels.Settings();
            settings.monthlyTakeHomeCents = cursor.getLong(cursor.getColumnIndexOrThrow("monthly_take_home_cents"));
            settings.payMonths = cursor.getDouble(cursor.getColumnIndexOrThrow("pay_months"));
            settings.workdaysPerMonth = cursor.getDouble(cursor.getColumnIndexOrThrow("workdays_per_month"));
            settings.onsiteHoursPerDay = cursor.getDouble(cursor.getColumnIndexOrThrow("onsite_hours_per_day"));
            settings.commuteHoursPerDay = cursor.getDouble(cursor.getColumnIndexOrThrow("commute_hours_per_day"));
            settings.overtimeHoursPerMonth = cursor.getDouble(cursor.getColumnIndexOrThrow("overtime_hours_per_month"));
            settings.workCostCentsPerMonth = cursor.getLong(cursor.getColumnIndexOrThrow("work_cost_cents_per_month"));
            settings.fundGoalCents = cursor.getLong(cursor.getColumnIndexOrThrow("fund_goal_cents"));
            settings.fundCurrentCents = cursor.getLong(cursor.getColumnIndexOrThrow("fund_current_cents"));
            settings.updatedAt = cursor.getLong(cursor.getColumnIndexOrThrow("updated_at"));
            return settings;
        }
    }

    private LedgerModels.Entry readEntry(Cursor cursor) {
        LedgerModels.Entry entry = new LedgerModels.Entry();
        entry.id = cursor.getLong(cursor.getColumnIndexOrThrow("_id"));
        entry.kind = cursor.getString(cursor.getColumnIndexOrThrow("kind"));
        entry.amountCents = cursor.getLong(cursor.getColumnIndexOrThrow("amount_cents"));
        entry.category = cursor.getString(cursor.getColumnIndexOrThrow("category"));
        entry.note = cursor.getString(cursor.getColumnIndexOrThrow("note"));
        entry.entryDate = cursor.getString(cursor.getColumnIndexOrThrow("entry_date"));
        entry.expenseType = cursor.getString(cursor.getColumnIndexOrThrow("expense_type"));
        entry.createdAt = cursor.getLong(cursor.getColumnIndexOrThrow("created_at"));
        entry.updatedAt = cursor.getLong(cursor.getColumnIndexOrThrow("updated_at"));
        return entry;
    }

    private ContentValues settingsValues(LedgerModels.Settings settings) {
        ContentValues values = new ContentValues();
        values.put("id", 1);
        values.put("monthly_take_home_cents", settings.monthlyTakeHomeCents);
        values.put("pay_months", settings.payMonths);
        values.put("workdays_per_month", settings.workdaysPerMonth);
        values.put("onsite_hours_per_day", settings.onsiteHoursPerDay);
        values.put("commute_hours_per_day", settings.commuteHoursPerDay);
        values.put("overtime_hours_per_month", settings.overtimeHoursPerMonth);
        values.put("work_cost_cents_per_month", settings.workCostCentsPerMonth);
        values.put("fund_goal_cents", settings.fundGoalCents);
        values.put("fund_current_cents", settings.fundCurrentCents);
        values.put("updated_at", settings.updatedAt == 0 ? System.currentTimeMillis() : settings.updatedAt);
        return values;
    }

    private ContentValues entryValues(LedgerModels.Entry entry, boolean includeId) {
        ContentValues values = new ContentValues();
        if (includeId) {
            values.put("_id", entry.id);
        }
        values.put("kind", entry.kind);
        values.put("amount_cents", entry.amountCents);
        values.put("category", entry.category.trim());
        values.put("note", entry.note == null ? "" : entry.note.trim());
        values.put("entry_date", entry.entryDate);
        if (entry.kind.equals("income")) {
            values.putNull("expense_type");
        } else {
            values.put("expense_type", entry.expenseType);
        }
        values.put("created_at", entry.createdAt == 0 ? System.currentTimeMillis() : entry.createdAt);
        values.put("updated_at", entry.updatedAt == 0 ? System.currentTimeMillis() : entry.updatedAt);
        return values;
    }

    private void validateSettings(LedgerModels.Settings settings) {
        if (settings == null || settings.monthlyTakeHomeCents < 0 || settings.workCostCentsPerMonth < 0
                || settings.fundGoalCents < 0 || settings.fundCurrentCents < 0
                || !validNonNegative(settings.payMonths) || !validNonNegative(settings.workdaysPerMonth)
                || !validNonNegative(settings.onsiteHoursPerDay) || !validNonNegative(settings.commuteHoursPerDay)
                || !validNonNegative(settings.overtimeHoursPerMonth)
                || settings.payMonths <= 0 || settings.workdaysPerMonth <= 0
                || settings.onsiteHoursPerDay + settings.commuteHoursPerDay <= 0) {
            throw new IllegalArgumentException("时薪设置必须是有效的非负数字，并且工作时间大于 0");
        }
    }

    private void validateEntry(LedgerModels.Entry entry) {
        if (entry == null || (!"income".equals(entry.kind) && !"expense".equals(entry.kind))) {
            throw new IllegalArgumentException("流水类型无效");
        }
        if (entry.amountCents <= 0 || entry.category == null || entry.category.trim().isEmpty()
                || entry.entryDate == null || !DATE_PATTERN.matcher(entry.entryDate).matches()) {
            throw new IllegalArgumentException("流水金额、分类或日期无效");
        }
        if ("expense".equals(entry.kind)
                && !"fixed".equals(entry.expenseType) && !"flexible".equals(entry.expenseType)) {
            throw new IllegalArgumentException("支出类型无效");
        }
        if ("income".equals(entry.kind) && entry.expenseType != null && !entry.expenseType.isEmpty()) {
            throw new IllegalArgumentException("收入不能设置固定或弹性");
        }
    }

    private boolean validNonNegative(double value) {
        return !Double.isNaN(value) && !Double.isInfinite(value) && value >= 0;
    }
}
