# Git 的工作区、暂存区与提交

先检查差异，再提交一次能说明目的的源码变更。

## 三个位置

工作区是当前文件，暂存区选出本次要提交的变化，提交是一次本地历史快照。提交不等于上传，上传也不等于网页发布。先在自己的独立练习仓库学习这些操作。

### 就地练习：暂存后再编辑

在独立练习仓库把版本A add，再编辑成B但不add。commit记录哪版？用两种diff核对。

### 参考核对：暂存后再编辑

提交暂存版A；普通diff为A到B，cached为上次提交到A，新工作区不会自动进入暂存。

## 最小操作顺序

```sh
# 检查工作区中哪些文件新增或变化。
git status
# 查看已跟踪文件尚未暂存的变化。
git diff
# 只把本次练习的源码放进暂存区。
git add index.html
# 提交前确认暂存区确实是自己想记录的内容。
git diff --cached
# 在本机记录快照；这一步没有发布网站。
git commit -m "study: update page heading"
```

先看status与diff确认改了什么，add只选当前练习的源码，cached查看将要提交的内容。commit记录说明，push是另外的远程操作。已有资料仓库不要为这节课重置或重写历史。

## 从一个改动开始

只修改网页标题，观察未暂存差异；add后观察暂存差异；提交后status应不再显示这次变更。新手先不练force push、reset --hard等破坏性操作。

### 参考答案

.gitignore排除依赖、产物和秘密，但已被跟踪的文件不会因新增ignore自动停止跟踪。先核对状态，不一口气git add所有未知文件。

## 配套

[本机到发布项目](../../../index.html#/followup/web/2)提供Git、GitHub Pages与资源路径的完整后续操作。

## 先准备一个自己的小仓库

Git 是在本机保存文件版本的工具；GitHub 是可保存远程仓库的服务，它们不是同一个东西。先在终端运行 `git --version` 确认 Git 已安装。找不到命令时，按环境教程安装并重开终端。

**在新建的独立 git-page 目录练习，不要重新初始化或重置现有学习仓库。** 用 VS Code 打开它，创建一个已保存的 index.html，然后在该目录执行 git init。这会生成保存历史的 .git 目录。下面命令针对这个目录，不是整个磁盘。

第一次提交若提示身份缺失，在这个独立仓库设置自己的 user.name 与 user.email，例如 `git config user.name "学习者"`；邮箱使用自己选择的公开或平台匿名邮箱。本节不配置 global，不要求把真实个人信息写进页面。

先提交初始文件，再改一个标题做第二次提交。工作区是眼前的文件内容，暂存区是你挑好的下次提交内容，提交是已经记录进历史的快照。add 之后如果又编辑文件，暂存区不会自动跟着变，必须检查是否需要再次 add。

新文件尚未跟踪时，git diff 可能不显示它的全文，但 git status 会列 untracked；add 之后 git diff --cached 才能看到准备提交的内容。提交后可用 git log --oneline 看两次记录。读取历史不等于上传，git push 需要另行配置远程。


## 独立变式：提交哪一版由自己选择

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。在自己的独立练习仓库操作，使用已讲status/diff/add/cached/commit/log，不做reset、force或现有仓库历史重写。

独立新增第二个说明文件，同时修改原HTML。先只选择HTML准备提交；暂存后再改HTML一行，不马上重新add。提交前自行预测工作区、暂存区各含哪版，再分两次记录HTML与说明文件。

自查：status能显示仍未暂存的新修改与第二文件；diff --cached只包含已选的HTML版本，不能夹入说明文件。第一次提交后新一行仍待处理，第二次选择性提交时说明文件才进入历史；log能解释两次目的，提交不等于上传或发布。

## 本地版本、远程备份和分支

commit保存的是暂存快照，push才把可达提交送到远程，发布还需要部署步骤。每次提交前看status、diff与diff --cached，确认改动范围。频繁、小而完整的提交便于定位问题，但不能只提交源文件而漏掉项目要求同步的生成数据。

fetch取回远程历史而不修改当前文件，pull还会整合。多人修改前先确认分支与未提交状态，不用强制推送覆盖别人的提交。修复已推送的错误优先用新提交留下证据，历史重写仅在明确需要且协作方知情时处理。

### 参考答案：独立实现与验收

在已初始化的独立练习仓库，先把HTML改成版本A并保存，新增notes.txt。然后：

```sh
git status
git add index.html
git diff --cached
```

此时再把HTML多改一行成版本B并保存，先不add：

```sh
git diff
git diff --cached
git commit -m "page: record version A"
git status
```

普通diff显示A→B的未暂存差异，cached显示原版→A；第一次提交记录A，notes.txt仍未跟踪，HTML的B仍待处理。第二次明确选择：

```sh
git add index.html notes.txt
git diff --cached
git commit -m "page: record version B and notes"
git log --oneline -3
```

第二次才同时记录B与说明文件。两次commit都仍是本地历史，推送前需确认自己的远程地址。

### 就地练习：取回历史不覆盖现场

写出fetch、pull、push分别做什么；已有未提交改动时，先检查哪些证据？

### 参考核对：取回历史不覆盖现场

fetch取历史，pull还整合，push送出提交；先看分支、status和差异，保留未提交工作，不强推覆盖。
