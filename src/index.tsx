import { ButtonItem, PanelSection, PanelSectionRow, staticClasses, ToggleField } from "@decky/ui";
import { callable, definePlugin, toaster } from "@decky/api";
import { useEffect, useState } from "react";
import { FaMicrochip } from "react-icons/fa";

type Status = {
  supported: boolean;
  groups: number[][];
  target: number[];
  target_online: number[];
  mode: "full" | "single_ccd" | "partial";
  message: string;
  apply_on_start: boolean;
  operation_error?: string;
  running_as_root: boolean;
  backend_uid: number;
  can_restore: boolean;
};

const getStatus = callable<[], Status>("get_status");
const setSingleCcd = callable<[enabled: boolean], Status>("set_single_ccd");
const setApplyOnStart = callable<[enabled: boolean], Status>("set_apply_on_start");

function cpuList(cpus: number[]): string {
  if (!cpus.length) return "—";
  const ranges: string[] = [];
  let start = cpus[0];
  let end = cpus[0];
  for (const cpu of cpus.slice(1)) {
    if (cpu === end + 1) { end = cpu; continue; }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    start = end = cpu;
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(", ");
}

function Content() {
  const [status, setStatus] = useState<Status>();
  const [busy, setBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const refresh = async () => {
    try { setStatus(await getStatus()); }
    catch (error) { toaster.toast({ title: "CCD Control 395", body: String(error) }); }
  };

  useEffect(() => { void refresh(); }, []);

  const changeMode = async () => {
    if (!status || (!status.supported && !(status.mode === "single_ccd" && status.can_restore))) return;
    setBusy(true);
    setActionMessage(status.mode === "single_ccd" ? "正在恢复全部32线程…" : "正在停用第二 CCD…");
    try {
      const next = await setSingleCcd(status.mode !== "single_ccd");
      setStatus(next);
      if (next.operation_error) {
        setActionMessage(`失败：${next.operation_error}`);
        toaster.toast({ title: "切换失败", body: next.operation_error });
        return;
      }
      setActionMessage(next.mode === "single_ccd" ? "第二个 CCD 已停用" : "双 CCD 已恢复");
      toaster.toast({ title: "CCD Control 395", body: next.mode === "single_ccd" ? "第二个 CCD 已停用" : "两个 CCD 已启用" });
    } catch (error) {
      setActionMessage(`前端调用失败：${String(error)}`);
      toaster.toast({ title: "切换失败", body: String(error) });
      await refresh();
    } finally { setBusy(false); }
  };

  const changeStartup = async (value: boolean) => {
    try { setStatus(await setApplyOnStart(value)); }
    catch (error) { toaster.toast({ title: "保存失败", body: String(error) }); }
  };

  const modeText = !status ? "正在检测…" : status.mode === "single_ccd" ? "单 CCD" : status.mode === "full" ? "双 CCD" : "部分核心离线";

  return <>
    <PanelSection title="当前状态">
      <PanelSectionRow><div>模式：{modeText}</div></PanelSectionRow>
      {status && !status.running_as_root && <PanelSectionRow><div style={{ color: "#ff776d" }}>后台权限：UID {status.backend_uid}（不是 root，无法切换）</div></PanelSectionRow>}
      {status && !status.supported && <PanelSectionRow><div style={{ color: status.can_restore ? "#ffcf66" : "#ffb35c", whiteSpace: "normal" }}>{status.message}</div></PanelSectionRow>}
      {status?.operation_error && <PanelSectionRow><div style={{ color: "#ff776d", whiteSpace: "normal", wordBreak: "break-word" }}>上次错误：{status.operation_error}</div></PanelSectionRow>}
      {actionMessage && <PanelSectionRow><div style={{ fontSize: "12px", whiteSpace: "normal", wordBreak: "break-word" }}>{actionMessage}</div></PanelSectionRow>}
      {status?.supported && <PanelSectionRow><div style={{ fontSize: "12px", opacity: 0.8, whiteSpace: "normal" }}>第二 CCD：8 核 / {status.target.length} 线程<br />逻辑处理器：{cpuList(status.target)}</div></PanelSectionRow>}
      <PanelSectionRow>
        <ButtonItem layout="below" disabled={busy || (!status?.supported && !(status?.mode === "single_ccd" && status?.can_restore)) || !status?.running_as_root} onClick={() => void changeMode()}>
          {busy ? "正在切换…" : status?.mode === "single_ccd" ? "恢复双 CCD" : "停用第二个 CCD"}
        </ButtonItem>
      </PanelSectionRow>
    </PanelSection>
    <PanelSection title="自动应用">
      <PanelSectionRow>
        <ToggleField label="插件启动时使用单 CCD" checked={status?.apply_on_start ?? false} disabled={!status} onChange={(value) => void changeStartup(value)} />
      </PanelSectionRow>
      <PanelSectionRow><div style={{ fontSize: "12px", opacity: 0.75 }}>仅修改 SteamOS 的在线 CPU 状态；不会写入 BIOS，因此 Windows 不受影响。</div></PanelSectionRow>
    </PanelSection>
  </>;
}

export default definePlugin(() => ({
  name: "CCD Control 395",
  titleView: <div className={staticClasses.Title}>CCD Control 395</div>,
  content: <Content />,
  icon: <FaMicrochip />,
  onDismount() {},
}));
