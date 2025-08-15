#!/bin/bash

# --- Configuration ---
# Set the interval in seconds. Can be a fraction like 0.1.
INTERVAL=0.1
# Define the log file name with a timestamp to avoid overwriting.
LOG_FILE="dmesg_underrun_log_$(date '+%Y%m%d_%H%M%S').log"

# --- Initialization ---
count=0
# Check if adb is available and a device is connected.
if ! adb get-state 1>/dev/null 2>&1; then
    echo "錯誤: adb 找不到設備或未安裝。請確認設備已連接且 USB 偵錯已啟用。"
    exit 1
fi

# Check for `bc` command for floating point math, needed for elapsed time calculation.
if ! command -v bc &> /dev/null; then
    echo "警告: 'bc' command not found. Elapsed time will not be calculated."
    echo "請安裝 'bc' (e.g., on Debian/Ubuntu: sudo apt-get install bc)"
    USE_BC=false
else
    USE_BC=true
fi


echo "開始檢查 underrun，間隔為 ${INTERVAL} 秒..."
echo "日誌將會儲存到: ${LOG_FILE}"
echo "按 Ctrl+C 停止。"
echo "----------------------------------------------------" | tee -a "$LOG_FILE"
echo "Log started at $(date '+%F %T')" | tee -a "$LOG_FILE"
echo "----------------------------------------------------" | tee -a "$LOG_FILE"


# --- Main Loop ---
while true; do
    ((count++))

    # Get a high-resolution timestamp (including milliseconds)
    timestamp=$(date '+%F %T.%3N')

    # Calculate elapsed time using 'bc' for floating point arithmetic
    if [ "$USE_BC" = true ]; then
        elapsed=$(bc <<< "$count * $INTERVAL")
        status_line="[${timestamp}] 第 ${count} 次檢查 (累積 ${elapsed}s)"
    else
        status_line="[${timestamp}] 第 ${count} 次檢查"
    fi

    # Print the status line to the console
    echo -n "$status_line"

    # Run the dmesg command and capture output
    # - `grep -i`: Case-insensitive search for 'underrun'
    # - `dmesg -c`: Clears the kernel ring buffer after reading
    dmesg_output=$(adb shell dmesg -c | grep -i 'underrun')

    # If grep finds a match, the output will not be empty
    if [[ -n "$dmesg_output" ]]; then
        # If something is found:
        # 1. Print a clear alert to the console.
        # 2. Log the status line and the found output to the file.
        echo " -> 找到 'underrun'！已記錄到日誌。"
        echo "$status_line -> 找到 'underrun'！" >> "$LOG_FILE"
        echo "$dmesg_output" >> "$LOG_FILE"
        echo "----------------------------------------" >> "$LOG_FILE"
    else
        # If nothing is found, just print a "not found" indicator
        echo " -> 未找到。"
    fi

    # Sleep for the configured interval
    sleep "$INTERVAL"
done