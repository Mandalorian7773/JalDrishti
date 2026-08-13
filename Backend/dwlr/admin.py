from django.contrib import admin
from import_export.admin import ImportExportModelAdmin

from .models import Reading, Station

admin.site.site_header = "JalDrishti DWLR Admin"
admin.site.site_title = "JalDrishti Admin"
admin.site.index_title = "Groundwater monitoring administration"


@admin.register(Station)
class StationAdmin(ImportExportModelAdmin):
    list_display = ('code', 'name', 'district', 'state', 'latest_level_mbgl',
                    'trend_m_per_year', 'category', 'data_quality', 'reading_count')
    list_filter = ('category', 'state', 'agency', 'well_type')
    search_fields = ('code', 'name', 'district', 'state')
    ordering = ('-trend_m_per_year',)


@admin.register(Reading)
class ReadingAdmin(admin.ModelAdmin):
    list_display = ('station', 'date', 'level_mbgl', 'samples')
    list_filter = ('date',)
    search_fields = ('station__code', 'station__name')
    raw_id_fields = ('station',)
