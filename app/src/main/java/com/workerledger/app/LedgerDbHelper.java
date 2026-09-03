package com.workerledger.app;

import android.content.ContentValues;
import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

final class LedgerDbHelper extends SQLiteOpenHelper {
    private static final String DATABASE_NAME = "worker-ledger.db";
    private static final int DATABASE_VERSION = 2;

    LedgerDbHelper(Context context) {
        super(context.getApplicationContext(), DATABASE_NAME, null, DATABASE_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE ledger_entries (" +
                "_id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "kind TEXT NOT NULL," +
                "amount_cents INTEGER NOT NULL," +
                "category TEXT NOT NULL," +
                "note TEXT," +
                "entry_date TEXT NOT NULL," +
                "expense_type TEXT," +
                "hourly_rate_cents_per_hour INTEGER," +
                "created_at INTEGER NOT NULL," +
                "updated_at INTEGER NOT NULL" + ")");
        db.execSQL("CREATE TABLE user_settings (" +
                "id INTEGER PRIMARY KEY," +
                "monthly_take_home_cents INTEGER NOT NULL," +
                "pay_months REAL NOT NULL," +
                "workdays_per_month REAL NOT NULL," +
                "onsite_hours_per_day REAL NOT NULL," +
                "commute_hours_per_day REAL NOT NULL," +
                "overtime_hours_per_month REAL NOT NULL," +
                "work_cost_cents_per_month INTEGER NOT NULL," +
                "fund_goal_cents INTEGER NOT NULL," +
                "fund_current_cents INTEGER NOT NULL," +
                "updated_at INTEGER NOT NULL)");
        ContentValues values = new ContentValues();
        values.put("id", 1);
        values.put("monthly_take_home_cents", 0);
        values.put("pay_months", 12);
        values.put("workdays_per_month", 21.75);
        values.put("onsite_hours_per_day", 8);
        values.put("commute_hours_per_day", 1);
        values.put("overtime_hours_per_month", 0);
        values.put("work_cost_cents_per_month", 0);
        values.put("fund_goal_cents", 0);
        values.put("fund_current_cents", 0);
        values.put("updated_at", System.currentTimeMillis());
        db.insertOrThrow("user_settings", null, values);
        db.execSQL("CREATE TABLE salary_history (" +
                "effective_month TEXT PRIMARY KEY," +
                "monthly_take_home_cents INTEGER NOT NULL," +
                "created_at INTEGER NOT NULL," +
                "updated_at INTEGER NOT NULL)");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        if (oldVersion < 2) {
            db.beginTransaction();
            try {
                db.execSQL("ALTER TABLE ledger_entries ADD COLUMN hourly_rate_cents_per_hour INTEGER");
                db.execSQL("CREATE TABLE IF NOT EXISTS salary_history (" +
                        "effective_month TEXT PRIMARY KEY," +
                        "monthly_take_home_cents INTEGER NOT NULL," +
                        "created_at INTEGER NOT NULL," +
                        "updated_at INTEGER NOT NULL" + ")");
                long salary = 0;
                double payMonths = 0, workdays = 0, onsite = 0, commute = 0, overtime = 0;
                long updatedAt = System.currentTimeMillis();
                try (android.database.Cursor cursor = db.query("user_settings", null, "id = ?", new String[]{"1"}, null, null, null)) {
                    if (cursor.moveToFirst()) {
                        salary = cursor.getLong(cursor.getColumnIndexOrThrow("monthly_take_home_cents"));
                        payMonths = cursor.getDouble(cursor.getColumnIndexOrThrow("pay_months"));
                        workdays = cursor.getDouble(cursor.getColumnIndexOrThrow("workdays_per_month"));
                        onsite = cursor.getDouble(cursor.getColumnIndexOrThrow("onsite_hours_per_day"));
                        commute = cursor.getDouble(cursor.getColumnIndexOrThrow("commute_hours_per_day"));
                        overtime = cursor.getDouble(cursor.getColumnIndexOrThrow("overtime_hours_per_month"));
                        updatedAt = cursor.getLong(cursor.getColumnIndexOrThrow("updated_at"));
                    }
                }
                Double denominator = workdays * (onsite + commute) + overtime;
                Long rate = salary > 0 && payMonths > 0 && Double.isFinite(denominator) && denominator > 0
                        ? Math.round((salary * (double) payMonths) / (12d * denominator)) : null;
                if (rate != null && rate > 0) {
                    ContentValues entries = new ContentValues(); entries.put("hourly_rate_cents_per_hour", rate);
                    db.update("ledger_entries", entries, "hourly_rate_cents_per_hour IS NULL", null);
                }
                ContentValues history = new ContentValues();
                history.put("effective_month", new SimpleDateFormat("yyyy-MM", Locale.getDefault()).format(new Date(updatedAt)));
                history.put("monthly_take_home_cents", salary); history.put("created_at", updatedAt); history.put("updated_at", updatedAt);
                db.insertWithOnConflict("salary_history", null, history, SQLiteDatabase.CONFLICT_REPLACE);
                db.setTransactionSuccessful();
            } finally { db.endTransaction(); }
        }
    }
}
