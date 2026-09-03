package com.workerledger.app;

import android.content.ContentValues;
import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

final class LedgerDbHelper extends SQLiteOpenHelper {
    private static final String DATABASE_NAME = "worker-ledger.db";
    private static final int DATABASE_VERSION = 1;

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
                "created_at INTEGER NOT NULL," +
                "updated_at INTEGER NOT NULL)");
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
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        // Version 1 is the first schema; future changes must be additive and preserve user data.
    }
}
