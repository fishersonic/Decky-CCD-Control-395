const manifest = {"name":"CCD Control 395"};
const API_VERSION = 2;
const internalAPIConnection = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
if (!internalAPIConnection) {
    throw new Error('[@decky/api]: Failed to connect to the loader as as the loader API was not initialized. This is likely a bug in Decky Loader.');
}
let api;
try {
    api = internalAPIConnection.connect(API_VERSION, manifest.name);
}
catch {
    api = internalAPIConnection.connect(1, manifest.name);
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version 1. Some features may not work.`);
}
if (api._version != API_VERSION) {
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version ${api._version}. Some features may not work.`);
}
const callable = api.callable;
const toaster = api.toaster;
const definePlugin = (fn) => {
    return (...args) => {
        return fn(...args);
    };
};

var DefaultContext = {
  color: undefined,
  size: undefined,
  className: undefined,
  style: undefined,
  attr: undefined
};
var IconContext = SP_REACT.createContext && /*#__PURE__*/SP_REACT.createContext(DefaultContext);

var _excluded = ["attr", "size", "title"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), true).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function Tree2Element(tree) {
  return tree && tree.map((node, i) => /*#__PURE__*/SP_REACT.createElement(node.tag, _objectSpread({
    key: i
  }, node.attr), Tree2Element(node.child)));
}
function GenIcon(data) {
  return props => /*#__PURE__*/SP_REACT.createElement(IconBase, _extends({
    attr: _objectSpread({}, data.attr)
  }, props), Tree2Element(data.child));
}
function IconBase(props) {
  var elem = conf => {
    var attr = props.attr,
      size = props.size,
      title = props.title,
      svgProps = _objectWithoutProperties(props, _excluded);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className) className = conf.className;
    if (props.className) className = (className ? className + " " : "") + props.className;
    return /*#__PURE__*/SP_REACT.createElement("svg", _extends({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className: className,
      style: _objectSpread(_objectSpread({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && /*#__PURE__*/SP_REACT.createElement("title", null, title), props.children);
  };
  return IconContext !== undefined ? /*#__PURE__*/SP_REACT.createElement(IconContext.Consumer, null, conf => elem(conf)) : elem(DefaultContext);
}

// THIS FILE IS AUTO GENERATED
function FaMicrochip (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M416 48v416c0 26.51-21.49 48-48 48H144c-26.51 0-48-21.49-48-48V48c0-26.51 21.49-48 48-48h224c26.51 0 48 21.49 48 48zm96 58v12a6 6 0 0 1-6 6h-18v6a6 6 0 0 1-6 6h-42V88h42a6 6 0 0 1 6 6v6h18a6 6 0 0 1 6 6zm0 96v12a6 6 0 0 1-6 6h-18v6a6 6 0 0 1-6 6h-42v-48h42a6 6 0 0 1 6 6v6h18a6 6 0 0 1 6 6zm0 96v12a6 6 0 0 1-6 6h-18v6a6 6 0 0 1-6 6h-42v-48h42a6 6 0 0 1 6 6v6h18a6 6 0 0 1 6 6zm0 96v12a6 6 0 0 1-6 6h-18v6a6 6 0 0 1-6 6h-42v-48h42a6 6 0 0 1 6 6v6h18a6 6 0 0 1 6 6zM30 376h42v48H30a6 6 0 0 1-6-6v-6H6a6 6 0 0 1-6-6v-12a6 6 0 0 1 6-6h18v-6a6 6 0 0 1 6-6zm0-96h42v48H30a6 6 0 0 1-6-6v-6H6a6 6 0 0 1-6-6v-12a6 6 0 0 1 6-6h18v-6a6 6 0 0 1 6-6zm0-96h42v48H30a6 6 0 0 1-6-6v-6H6a6 6 0 0 1-6-6v-12a6 6 0 0 1 6-6h18v-6a6 6 0 0 1 6-6zm0-96h42v48H30a6 6 0 0 1-6-6v-6H6a6 6 0 0 1-6-6v-12a6 6 0 0 1 6-6h18v-6a6 6 0 0 1 6-6z"},"child":[]}]})(props);
}

const getStatus = callable("get_status");
const setSingleCcd = callable("set_single_ccd");
const setApplyOnStart = callable("set_apply_on_start");
function cpuList(cpus) {
    if (!cpus.length)
        return "—";
    const ranges = [];
    let start = cpus[0];
    let end = cpus[0];
    for (const cpu of cpus.slice(1)) {
        if (cpu === end + 1) {
            end = cpu;
            continue;
        }
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        start = end = cpu;
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    return ranges.join(", ");
}
function Content() {
    const [status, setStatus] = SP_REACT.useState();
    const [busy, setBusy] = SP_REACT.useState(false);
    const [actionMessage, setActionMessage] = SP_REACT.useState("");
    const refresh = async () => {
        try {
            setStatus(await getStatus());
        }
        catch (error) {
            toaster.toast({ title: "CCD Control 395", body: String(error) });
        }
    };
    SP_REACT.useEffect(() => { void refresh(); }, []);
    const changeMode = async () => {
        if (!status || (!status.supported && !(status.mode === "single_ccd" && status.can_restore)))
            return;
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
        }
        catch (error) {
            setActionMessage(`前端调用失败：${String(error)}`);
            toaster.toast({ title: "切换失败", body: String(error) });
            await refresh();
        }
        finally {
            setBusy(false);
        }
    };
    const changeStartup = async (value) => {
        try {
            setStatus(await setApplyOnStart(value));
        }
        catch (error) {
            toaster.toast({ title: "保存失败", body: String(error) });
        }
    };
    const modeText = !status ? "正在检测…" : status.mode === "single_ccd" ? "单 CCD" : status.mode === "full" ? "双 CCD" : "部分核心离线";
    return SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs(DFL.PanelSection, { title: "\u5F53\u524D\u72B6\u6001", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { children: ["\u6A21\u5F0F\uFF1A", modeText] }) }), status && !status.running_as_root && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { color: "#ff776d" }, children: ["\u540E\u53F0\u6743\u9650\uFF1AUID ", status.backend_uid, "\uFF08\u4E0D\u662F root\uFF0C\u65E0\u6CD5\u5207\u6362\uFF09"] }) }), status && !status.supported && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { color: status.can_restore ? "#ffcf66" : "#ffb35c", whiteSpace: "normal" }, children: status.message }) }), status?.operation_error && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { color: "#ff776d", whiteSpace: "normal", wordBreak: "break-word" }, children: ["\u4E0A\u6B21\u9519\u8BEF\uFF1A", status.operation_error] }) }), actionMessage && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: "12px", whiteSpace: "normal", wordBreak: "break-word" }, children: actionMessage }) }), status?.supported && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: "12px", opacity: 0.8, whiteSpace: "normal" }, children: ["\u7B2C\u4E8C CCD\uFF1A8 \u6838 / ", status.target.length, " \u7EBF\u7A0B", SP_JSX.jsx("br", {}), "\u903B\u8F91\u5904\u7406\u5668\uFF1A", cpuList(status.target)] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: busy || (!status?.supported && !(status?.mode === "single_ccd" && status?.can_restore)) || !status?.running_as_root, onClick: () => void changeMode(), children: busy ? "正在切换…" : status?.mode === "single_ccd" ? "恢复双 CCD" : "停用第二个 CCD" }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "\u81EA\u52A8\u5E94\u7528", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "\u63D2\u4EF6\u542F\u52A8\u65F6\u4F7F\u7528\u5355 CCD", checked: status?.apply_on_start ?? false, disabled: !status, onChange: (value) => void changeStartup(value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: "12px", opacity: 0.75 }, children: "\u4EC5\u4FEE\u6539 SteamOS \u7684\u5728\u7EBF CPU \u72B6\u6001\uFF1B\u4E0D\u4F1A\u5199\u5165 BIOS\uFF0C\u56E0\u6B64 Windows \u4E0D\u53D7\u5F71\u54CD\u3002" }) })] })] });
}
var index = definePlugin(() => ({
    name: "CCD Control 395",
    titleView: SP_JSX.jsx("div", { className: DFL.staticClasses.Title, children: "CCD Control 395" }),
    content: SP_JSX.jsx(Content, {}),
    icon: SP_JSX.jsx(FaMicrochip, {}),
    onDismount() { },
}));

export { index as default };
//# sourceMappingURL=index.js.map
