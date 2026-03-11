<template>
  <div id="app">
    <div class="mainbox">
      <h1 class="main-title">项目看板</h1>
      <div ref="filterBar" class="filter-bar" :class="{fixed: isFixed}">
		<section class="section">
		  <h2>开发角色</h2>
		  <div class="filter-list" v-cloak>
			<label v-for="role in roles" :key="role.tag" class="label">
			  <input type="checkbox"
					 :value="role.tag"
					 v-model="selectedRoles">
			  <span class="label-base">
				<svg class="svgicon">
				  <use :xlink:href="'#icon-' + role.tag"></use>
				</svg>
				{{ role.name }} <small>({{ countInfo.role[role.tag] ?? 0 }})</small>
			  </span>
			</label>
		  </div>
		</section>
		<section class="section">
		  <h2>项目类型</h2>
		  <div class="filter-list" v-cloak>
			<label v-for="item in categories" :key="item.tag" class="label">
			  <input type="checkbox"
					 :value="item.tag"
					 v-model="selectedCategories">
			  <span class="label-base">
				<svg class="svgicon">
				  <use :xlink:href="'#icon-' + item.tag"></use>
				</svg>
				{{ item.name }} <small>({{ countInfo.category[item.tag] ?? 0 }})</small>
			  </span>
			</label>
		  </div>
		</section>
	  </div>
      <section class="project">
        <h2>项目记录</h2>
        <div v-cloak>
          <p v-if="isLoading" style="text-align: center">loading...</p>
          <template v-else v-for="project in groupedProjectsData" :key="project.year">
            <h3 class="year">
              <a href="javascript:;"
                 :class="{'is-fold': !project.isOpen}"
                 @click="toggleYear(project.year)">{{ project.year }}</a>
            </h3>
            <transition name="list-fade">
              <ul class="project-list" v-show="project.isOpen">
                <template v-for="(item, idx) in project.data" :key="idx">
                  <li v-if="isShow(item)">
                    <p>
                      <span class="label">
                        <span class="label-base">
                          <svg class="svgicon">
                            <use :xlink:href="'#icon-' + item.category"></use>
                          </svg>
                          {{ getCategory(item.category) }}
                        </span>
                      </span>
                    </p>
                    <h4 class="project-name">
                      <a :href="item.url || 'javascript:;'"
                         :target="item.url ? '_blank' : ''">
                        {{ item.name }}
                      </a>
                    </h4>
                    <p class="project-type">{{ item.lang }}</p>
                    <dl class="project-info">
                      <dt>项目描述：</dt>
                      <dd>{{ item.intro }}</dd>
                      <dt>我的角色：</dt>
                      <dd>
                        <span class="label" v-for="roleTag in item.role" :key="roleTag">
                          <span class="label-base" :class="'theme-' + getRole(roleTag).theme">
                            <svg class="svgicon">
                              <use :xlink:href="'#icon-' + getRole(roleTag).tag"></use>
                            </svg>
                            {{ getRole(roleTag).name }}
                          </span>
                        </span>
                      </dd>
                      <dt>我的职责：</dt>
                      <dd>
                        <ol>
                          <li v-for="(duty, idx) in item.duty" :key="idx">
                            {{ buildDutyList(duty, idx, item.duty) }}
                          </li>
                        </ol>
                      </dd>
                    </dl>
                  </li>
                </template>
              </ul>
            </transition>
          </template>
        </div>
      </section>
    </div>
    <!-- SVG图标内联 -->
    <div v-html="svgIcons" style="display: none;"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount, reactive } from 'vue'
import rolesData from '@/assets/json/roles.json'
import categoriesData from '@/assets/json/category.json'
import { sortBy } from '@/utils/sort-arr'

// SVG图标内联
import svgIcons from '@/assets/images/svg-icon.html?raw'

// 响应式数据
const selectedRoles = ref(['pm', 'ui', 'fe', 'rd', 'qa', 'op'])
const selectedCategories = ref(['cloud', 'web', 'app', 'wechat', 'tools', 'screen', 'software'])
const isLoading = ref(true)
const projects = ref([])
const roles = ref(rolesData)
const categories = ref(categoriesData)
const countInfo = reactive({
  role: {},
  category: {}
})

// sticky 状态
const isFixed = ref(false)
const filterBar = ref(null)

// 年份分组数据（响应式，直接修改）
const groupedProjectsData = ref([])

// 更新年份分组数据的函数
const updateGroupedProjects = () => {
  const data = [...projects.value]
  data.sort(sortBy('year', true)) // 按年份降序

  const dataArr = []
  const hash = {}
  const existingYearStates = {}

  // 收集现有年份的展开状态
  groupedProjectsData.value.forEach(group => {
    existingYearStates[group.year] = group.isOpen
  })

  data.forEach(item => {
    const year = item.year

    item.role.forEach(roleTag => {
      countInfo.role[roleTag] = (countInfo.role[roleTag] || 0) + 1
    })

    countInfo.category[item.category] = (countInfo.category[item.category] || 0) + 1

    if (!hash[year]) {
      dataArr.push({
        year,
        isOpen: existingYearStates[year] ?? true, // 保持现有状态，默认展开
        data: []
      })
      hash[year] = true
    }

    for (let i = 0; i < dataArr.length; i++) {
      if (dataArr[i].year === year) {
        dataArr[i].data.push(item)
        break
      }
    }
  })

  // 分类项目排序
  dataArr.forEach(item => {
    item.data.sort(sortBy('category'))
  })

  // 更新响应式数据
  groupedProjectsData.value = dataArr
}

// 切换年份展开状态
const toggleYear = (year) => {
  const group = groupedProjectsData.value.find(g => g.year === year)
  if (group) {
    group.isOpen = !group.isOpen
  }
}

// 监听projects变化，更新分组数据
watch(() => projects.value, () => {
  updateGroupedProjects()
}, { immediate: true })

// 筛选显示
const isShow = (item) => {
  if (!item) return false
  // 类名筛选
  const matchCategory = selectedCategories.value.includes(item.category)
  // 角色筛选
  const matchRole = item.role.some(roleTag => selectedRoles.value.includes(roleTag))
  return matchCategory && matchRole
}

const buildDutyList = (item, idx, array) => {
  let str = item + (idx === array.length - 1 ? '。' : '；')
  if (array.length > 1) {
    str = (idx + 1) + '. ' + str
  }
  return str
}

const _getFilter = (tag, obj) => {
  for (let i = 0; i < obj.length; i++) {
    if (tag === obj[i].tag) {
      return obj[i]
    }
  }
  return null
}

const getCategory = (tag) => {
  const found = _getFilter(tag, categories.value)
  return found ? found.name : ''
}

const getRole = (tag) => {
  const found = _getFilter(tag, roles.value)
  return found || { tag: '', name: '', theme: '' }
}

// 初始化加载数据及 sticky 监听
onMounted(() => {
  const checkSticky = () => {
    if (filterBar.value) {
      isFixed.value = filterBar.value.getBoundingClientRect().top <= 0
    }
  }

  window.addEventListener('scroll', checkSticky)
  checkSticky()

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', checkSticky)
  })

  // 使用 fetch 异步加载 projects.json
  fetch('./data/projects.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    })
    .then(data => {
      projects.value = data
      isLoading.value = false
    })
    .catch(error => {
      console.error('Failed to load projects data:', error)
      isLoading.value = false
    })
})
</script>
