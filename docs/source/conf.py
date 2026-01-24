# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = "ITAIIT's Notebook"
copyright = '2025, itaiit'
author = 'itaiit'
release = '0.1'
language = 'zh_CN'

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = [
    'myst_parser'
    ]

templates_path = ['_templates']
exclude_patterns = []



# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = 'sphinx_rtd_theme'

html_title = "ITAIIT's Notebook"

html_static_path = ['_static']

html_css_files = [
    'custom.css',
]

html_theme_options = {
    'collapse_navigation': False,        # 是否默认折叠侧边栏
    'sticky_navigation': True,           # 滚动时固定导航
    'navigation_depth': 10,               # 侧边栏显示的层级深度
    'titles_only': False,                # 仅显示页面标题（设为 False 显示子标题）
    'includehidden': True
}

source_suffix = {
    ".rst": "restructuredtext",
    ".md": "markdown",
}